import re
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import (
    FDRInstrument, Institution, Bank, User, Document, VerificationCheck, ScrutinyObservation
)
from app.schemas.schemas import FDRCreate, FDRUpdate, VerificationDecisionRequest, RenewalCreateRequest
from app.services.audit_service import record_audit_event

def normalize_reference(ref: str) -> str:
    """Normalize FDR reference string: uppercase, stripping spaces and dashes."""
    return re.sub(r'[^A-Za-z0-9]', '', ref).upper()

def validate_fdr_dates(issue_date_str: str, maturity_date_str: str):
    try:
        issue = datetime.strptime(issue_date_str, "%Y-%m-%d").date()
        mat = datetime.strptime(maturity_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Dates must be in standard YYYY-MM-DD format."
        )
    if mat <= issue:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maturity date ({maturity_date_str}) must be later than Issue date ({issue_date_str})."
        )

def create_fdr_instrument(
    db: Session,
    payload: FDRCreate,
    current_user: User,
    target_institution_id: str
) -> FDRInstrument:
    validate_fdr_dates(payload.issue_date, payload.maturity_date)

    if payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Amount must be positive."
        )

    norm_ref = normalize_reference(payload.fdr_number)
    # Check duplicate candidates in the same institution or bank
    existing = db.query(FDRInstrument).filter(
        FDRInstrument.institution_id == target_institution_id,
        FDRInstrument.normalized_reference == norm_ref
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An FDR with normalized reference '{norm_ref}' already exists for this institution ({existing.fdr_number})."
        )

    status_val = "Draft" if payload.is_draft else "Submitted"
    fdr = FDRInstrument(
        institution_id=target_institution_id,
        fdr_number=payload.fdr_number.strip(),
        normalized_reference=norm_ref,
        bank_id=payload.bank_id,
        bank_name_snapshot=payload.bank_name.strip(),
        amount=payload.amount,
        currency=payload.currency,
        issue_date=payload.issue_date,
        maturity_date=payload.maturity_date,
        deposit_type=payload.deposit_type,
        status=status_val,
        verification_status="Pending Scrutiny" if status_val == "Submitted" else "Unverified",
        submitted_at=datetime.utcnow() if status_val == "Submitted" else None,
        remarks=payload.remarks,
        created_by=current_user.full_name
    )
    db.add(fdr)
    db.commit()
    db.refresh(fdr)

    # Automatically add initial rule check
    rule_check = VerificationCheck(
        instrument_id=fdr.id,
        check_type="DATE_SEQUENCE",
        submitted_value=f"Issue: {payload.issue_date}, Maturity: {payload.maturity_date}",
        extracted_value="Maturity > Issue validated",
        result="PASS",
        evidence_source="RULE_ENGINE",
        checked_by="SYSTEM",
        notes="Automated chronological integrity verification."
    )
    db.add(rule_check)
    db.commit()

    record_audit_event(
        db,
        action="CREATE_FDR_DRAFT" if payload.is_draft else "SUBMIT_FDR",
        entity_type="FDRInstrument",
        entity_id=fdr.id,
        actor=current_user,
        after={"fdr_number": fdr.fdr_number, "status": fdr.status, "amount": fdr.amount},
        reason="Institution initial creation"
    )

    return fdr

def submit_draft_fdr(db: Session, fdr_id: str, current_user: User, clarification_note: Optional[str] = None) -> FDRInstrument:
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR not found.")
    
    if fdr.status not in ["Draft", "Returned for Clarification", "Discrepancy Flagged"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft, Returned for Clarification, or Discrepancy Flagged FDRs can be submitted. Current status: {fdr.status}"
        )
    
    # Check that at least one document is attached
    doc_count = db.query(Document).filter(Document.instrument_id == fdr.id).count()
    if doc_count == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot submit FDR without uploading the required Fixed Deposit Receipt document."
        )

    old_status = fdr.status
    fdr.status = "Submitted"
    fdr.verification_status = "Pending Scrutiny"
    fdr.submitted_at = datetime.utcnow()
    if clarification_note:
        fdr.remarks = f"{fdr.remarks or ''}\n[Clarification Response]: {clarification_note}".strip()
    fdr.version += 1
    db.commit()

    record_audit_event(
        db,
        action="RESUBMIT_CLARIFIED_FDR" if old_status != "Draft" else "SUBMIT_FDR_FROM_DRAFT",
        entity_type="FDRInstrument",
        entity_id=fdr.id,
        actor=current_user,
        reason=clarification_note or "Formal submission for AICTE verification."
    )
    return fdr

def process_verification_decision(
    db: Session,
    fdr_id: str,
    decision: VerificationDecisionRequest,
    current_user: User
) -> FDRInstrument:
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR record not found.")

    old_status = fdr.status
    old_ver_status = fdr.verification_status

    if decision.action == "VERIFY":
        fdr.status = "Verified / Active"
        fdr.verification_status = "Verified"
        fdr.verified_at = datetime.utcnow()
        fdr.verified_by = current_user.full_name

        # If this instrument has a predecessor, mark predecessor as Replaced / Superseded
        if fdr.predecessor_instrument_id:
            pred = db.query(FDRInstrument).filter(FDRInstrument.id == fdr.predecessor_instrument_id).first()
            if pred:
                pred.status = "Replaced / Superseded"
                pred.successor_instrument_id = fdr.id
                db.add(pred)

    elif decision.action == "FLAG_DISCREPANCY":
        fdr.status = "Discrepancy Flagged"
        fdr.verification_status = "Discrepancy"
    elif decision.action == "REQUEST_CLARIFICATION":
        fdr.status = "Returned for Clarification"
        fdr.verification_status = "Pending Clarification"
    elif decision.action == "REJECT":
        fdr.status = "Rejected"
        fdr.verification_status = "Rejected"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown decision action: {decision.action}"
        )

    fdr.version += 1
    db.commit()

    record_audit_event(
        db,
        action=f"VERIFICATION_{decision.action}",
        entity_type="FDRInstrument",
        entity_id=fdr.id,
        actor=current_user,
        before={"status": old_status, "verification_status": old_ver_status},
        after={"status": fdr.status, "verification_status": fdr.verification_status},
        reason=decision.reason
    )

    return fdr

def create_renewal_replacement(
    db: Session,
    predecessor_id: str,
    payload: RenewalCreateRequest,
    current_user: User
) -> FDRInstrument:
    pred = db.query(FDRInstrument).filter(FDRInstrument.id == predecessor_id).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original FDR not found.")

    validate_fdr_dates(payload.issue_date, payload.maturity_date)

    norm_ref = normalize_reference(payload.fdr_number)
    
    # New replacement FDR record
    replacement = FDRInstrument(
        institution_id=pred.institution_id,
        fdr_number=payload.fdr_number.strip(),
        normalized_reference=norm_ref,
        bank_name_snapshot=payload.bank_name.strip(),
        amount=payload.amount,
        currency="INR",
        issue_date=payload.issue_date,
        maturity_date=payload.maturity_date,
        deposit_type=pred.deposit_type,
        status="Submitted",
        verification_status="Pending Scrutiny",
        submitted_at=datetime.utcnow(),
        predecessor_instrument_id=pred.id,
        remarks=f"Replacement instrument for predecessor {pred.fdr_number}. {payload.remarks or ''}",
        created_by=current_user.full_name
    )
    db.add(replacement)
    
    # Mark predecessor status as Renewal Pending
    pred.status = "Renewal Pending"
    pred.successor_instrument_id = replacement.id
    db.commit()
    db.refresh(replacement)

    record_audit_event(
        db,
        action="SUBMIT_RENEWAL_REPLACEMENT",
        entity_type="FDRInstrument",
        entity_id=replacement.id,
        actor=current_user,
        reason=f"Linked replacement created for expired/maturing predecessor {pred.fdr_number} ({pred.id})."
    )
    return replacement
