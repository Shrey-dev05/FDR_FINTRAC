from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import FDRInstrument, Institution, Document, VerificationCheck, ScrutinyObservation, User
from app.schemas.schemas import (
    FDRCreate, FDRUpdate, FDRDetailOut, RenewalCreateRequest,
    ScrutinyObservationCreate, ScrutinyObservationOut, ObservationResolveRequest
)
from app.core.deps import get_current_user, verify_institution_scope
from app.services.fdr_service import (
    create_fdr_instrument, submit_draft_fdr, create_renewal_replacement, validate_fdr_dates, normalize_reference
)
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/fdrs", tags=["FDR Instruments"])

@router.get("")
def list_fdrs(
    status_filter: Optional[str] = Query(None, alias="status"),
    bank_filter: Optional[str] = Query(None, alias="bank"),
    institution_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FDRInstrument)

    # Scoping: Institution users see only their institution
    if current_user.role == "INSTITUTION_USER":
        query = query.filter(FDRInstrument.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(FDRInstrument.institution_id == institution_id)

    if status_filter and status_filter != "ALL":
        query = query.filter(FDRInstrument.status == status_filter)

    if bank_filter and bank_filter != "ALL":
        query = query.filter(FDRInstrument.bank_name_snapshot.ilike(f"%{bank_filter}%"))

    if search:
        s = f"%{search.strip()}%"
        query = query.join(Institution).filter(
            (FDRInstrument.fdr_number.ilike(s)) |
            (FDRInstrument.bank_name_snapshot.ilike(s)) |
            (Institution.legal_name.ilike(s)) |
            (Institution.institution_code.ilike(s))
        )

    total = query.count()

    # Sorting
    if hasattr(FDRInstrument, sort_by):
        col = getattr(FDRInstrument, sort_by)
        query = query.order_by(col.desc() if sort_order.lower() == "desc" else col.asc())
    else:
        query = query.order_by(FDRInstrument.created_at.desc())

    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "institution_id": r.institution_id,
            "institution_name": r.institution.legal_name if r.institution else None,
            "institution_code": r.institution.institution_code if r.institution else None,
            "fdr_number": r.fdr_number,
            "bank_name_snapshot": r.bank_name_snapshot,
            "amount": r.amount,
            "currency": r.currency,
            "issue_date": r.issue_date,
            "maturity_date": r.maturity_date,
            "deposit_type": r.deposit_type,
            "status": r.status,
            "verification_status": r.verification_status,
            "submitted_at": r.submitted_at,
            "verified_at": r.verified_at,
            "verified_by": r.verified_by,
            "created_by": r.created_by,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "predecessor_instrument_id": r.predecessor_instrument_id,
            "successor_instrument_id": r.successor_instrument_id
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if page_size > 0 else 1
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_fdr(
    payload: FDRCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Determine target institution
    if current_user.role == "INSTITUTION_USER":
        target_inst = current_user.institution_id
        if not target_inst:
            raise HTTPException(status_code=400, detail="User is not associated with any institution.")
    else:
        target_inst = payload.institution_id
        if not target_inst:
            raise HTTPException(status_code=422, detail="Institution ID is required for administrative submission.")

    fdr = create_fdr_instrument(db, payload, current_user, target_inst)
    return {"message": "FDR created successfully", "id": fdr.id, "status": fdr.status, "fdr_number": fdr.fdr_number}

@router.get("/{id}")
def get_fdr_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR instrument not found.")

    verify_institution_scope(current_user, fdr.institution_id)

    # Documents
    docs = db.query(Document).filter(Document.instrument_id == fdr.id).all()
    # Checks
    checks = db.query(VerificationCheck).filter(VerificationCheck.instrument_id == fdr.id).all()
    # Observations
    observations = db.query(ScrutinyObservation).filter(ScrutinyObservation.instrument_id == fdr.id).all()

    # Predecessor / successor details if any
    pred_data = None
    if fdr.predecessor_instrument_id:
        p = db.query(FDRInstrument).filter(FDRInstrument.id == fdr.predecessor_instrument_id).first()
        if p:
            pred_data = {"id": p.id, "fdr_number": p.fdr_number, "bank": p.bank_name_snapshot, "amount": p.amount, "status": p.status}

    succ_data = None
    if fdr.successor_instrument_id:
        s = db.query(FDRInstrument).filter(FDRInstrument.id == fdr.successor_instrument_id).first()
        if s:
            succ_data = {"id": s.id, "fdr_number": s.fdr_number, "bank": s.bank_name_snapshot, "amount": s.amount, "status": s.status}

    return {
        "id": fdr.id,
        "institution_id": fdr.institution_id,
        "institution_name": fdr.institution.legal_name if fdr.institution else None,
        "institution_code": fdr.institution.institution_code if fdr.institution else None,
        "institution_address": fdr.institution.address if fdr.institution else None,
        "institution_state": fdr.institution.state if fdr.institution else None,
        "fdr_number": fdr.fdr_number,
        "normalized_reference": fdr.normalized_reference,
        "bank_name_snapshot": fdr.bank_name_snapshot,
        "amount": fdr.amount,
        "currency": fdr.currency,
        "issue_date": fdr.issue_date,
        "maturity_date": fdr.maturity_date,
        "deposit_type": fdr.deposit_type,
        "status": fdr.status,
        "verification_status": fdr.verification_status,
        "submitted_at": fdr.submitted_at,
        "verified_at": fdr.verified_at,
        "verified_by": fdr.verified_by,
        "remarks": fdr.remarks,
        "version": fdr.version,
        "created_by": fdr.created_by,
        "created_at": fdr.created_at,
        "updated_at": fdr.updated_at,
        "predecessor": pred_data,
        "successor": succ_data,
        "documents": [
            {
                "id": d.id,
                "document_type": d.document_type,
                "original_filename": d.original_filename,
                "mime_type": d.mime_type,
                "size_bytes": d.size_bytes,
                "uploaded_by": d.uploaded_by,
                "uploaded_at": d.uploaded_at,
                "scan_status": d.scan_status,
                "version": d.version
            }
            for d in docs
        ],
        "checks": [
            {
                "id": c.id,
                "check_type": c.check_type,
                "submitted_value": c.submitted_value,
                "extracted_value": c.extracted_value,
                "result": c.result,
                "evidence_source": c.evidence_source,
                "evidence_reference": c.evidence_reference,
                "checked_by": c.checked_by,
                "checked_at": c.checked_at,
                "notes": c.notes
            }
            for c in checks
        ],
        "observations": [
            {
                "id": o.id,
                "author_id": o.author_id,
                "author_name": o.author_name,
                "category": o.category,
                "severity": o.severity,
                "message": o.message,
                "status": o.status,
                "resolution_note": o.resolution_note,
                "resolved_by": o.resolved_by,
                "resolved_at": o.resolved_at,
                "created_at": o.created_at
            }
            for o in observations
        ]
    }

@router.patch("/{id}")
def update_draft_fdr(
    id: str,
    payload: FDRUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found.")
    verify_institution_scope(current_user, fdr.institution_id)

    if fdr.status not in ["Draft", "Returned for Clarification"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit FDR in status '{fdr.status}'. Only Draft or Returned instruments may be edited."
        )

    if payload.fdr_number:
        fdr.fdr_number = payload.fdr_number.strip()
        fdr.normalized_reference = normalize_reference(payload.fdr_number)
    if payload.bank_name:
        fdr.bank_name_snapshot = payload.bank_name.strip()
    if payload.amount and payload.amount > 0:
        fdr.amount = payload.amount
    if payload.issue_date:
        fdr.issue_date = payload.issue_date
    if payload.maturity_date:
        fdr.maturity_date = payload.maturity_date
    if payload.deposit_type:
        fdr.deposit_type = payload.deposit_type
    if payload.remarks is not None:
        fdr.remarks = payload.remarks

    validate_fdr_dates(fdr.issue_date, fdr.maturity_date)
    fdr.version += 1
    db.commit()

    record_audit_event(
        db, action="UPDATE_FDR_DRAFT", entity_type="FDRInstrument", entity_id=fdr.id, actor=current_user
    )
    return {"message": "Draft updated successfully", "id": fdr.id}

@router.post("/{id}/submit")
def submit_fdr(
    id: str,
    payload: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found.")
    verify_institution_scope(current_user, fdr.institution_id)

    clarification_note = payload.get("clarification_note") if payload else None
    res = submit_draft_fdr(db, id, current_user, clarification_note)
    return {"message": "FDR submitted for AICTE scrutiny", "id": res.id, "status": res.status}

@router.post("/{id}/renewal")
def submit_renewal(
    id: str,
    payload: RenewalCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found.")
    verify_institution_scope(current_user, fdr.institution_id)

    replacement = create_renewal_replacement(db, id, payload, current_user)
    return {
        "message": "Replacement FDR submitted and linked to predecessor",
        "replacement_id": replacement.id,
        "fdr_number": replacement.fdr_number
    }
