from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import RequestCase, RequestEvent, FDRInstrument, User
from app.schemas.schemas import RequestCreate, RequestDecision, RequestComplete
from app.services.audit_service import record_audit_event

def create_request_case(
    db: Session,
    payload: RequestCreate,
    current_user: User
) -> RequestCase:
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == payload.instrument_id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated FDR not found.")

    if payload.request_type == "RELEASE_REFUND":
        # Check if FDR is eligible (e.g. Verified / Active or Matured)
        if fdr.status not in ["Verified / Active", "Matured / Action Required", "Replaced / Superseded"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot initiate release request for FDR in '{fdr.status}' state."
            )
        fdr.status = "Release Pending"

    request = RequestCase(
        institution_id=fdr.institution_id,
        instrument_id=fdr.id,
        request_type=payload.request_type,
        status="Submitted",
        reason=payload.reason.strip(),
        submitted_by=current_user.full_name
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    # Initial event
    event = RequestEvent(
        request_id=request.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        event_type="SUBMIT",
        from_status="None",
        to_status="Submitted",
        comment=payload.reason
    )
    db.add(event)
    db.commit()

    record_audit_event(
        db,
        action=f"REQUEST_SUBMITTED_{payload.request_type}",
        entity_type="RequestCase",
        entity_id=request.id,
        actor=current_user,
        reason=payload.reason
    )
    return request

def process_request_decision(
    db: Session,
    request_id: str,
    payload: RequestDecision,
    current_user: User
) -> RequestCase:
    req = db.query(RequestCase).filter(RequestCase.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    # Separation of duties check: Submitter cannot approve their own request
    if req.submitted_by == current_user.full_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Separation of duties violation: Submitter cannot decide on their own request."
        )

    old_status = req.status
    if payload.decision == "APPROVE":
        req.status = "Approved"
    elif payload.decision == "REJECT":
        req.status = "Rejected"
        # Revert FDR status if release was rejected
        if req.request_type == "RELEASE_REFUND" and req.fdr:
            req.fdr.status = "Verified / Active"
    elif payload.decision == "RETURN_FOR_CLARIFICATION":
        req.status = "Returned for Clarification"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid decision.")

    req.decided_by = current_user.full_name
    req.decided_at = datetime.utcnow()
    req.decision_reason = payload.decision_reason.strip()

    event = RequestEvent(
        request_id=req.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        event_type="DECIDE",
        from_status=old_status,
        to_status=req.status,
        comment=payload.decision_reason
    )
    db.add(event)
    db.commit()

    record_audit_event(
        db,
        action=f"REQUEST_DECISION_{req.status}",
        entity_type="RequestCase",
        entity_id=req.id,
        actor=current_user,
        before={"status": old_status},
        after={"status": req.status, "decided_by": req.decided_by},
        reason=payload.decision_reason
    )
    return req

def complete_release_request(
    db: Session,
    request_id: str,
    payload: RequestComplete,
    current_user: User
) -> RequestCase:
    req = db.query(RequestCase).filter(RequestCase.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    if req.status != "Approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Approved requests can be completed. Current status: {req.status}"
        )

    if not payload.completion_reference or not payload.completion_reference.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Official bank discharge / administrative completion reference is strictly required."
        )

    old_status = req.status
    req.status = "Completed / Released"
    req.completion_reference = payload.completion_reference.strip()
    req.completed_at = datetime.utcnow()

    # Mark FDR as Released / Closed
    if req.fdr:
        req.fdr.status = "Released / Closed"

    event = RequestEvent(
        request_id=req.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        event_type="COMPLETE",
        from_status=old_status,
        to_status=req.status,
        comment=f"Released confirmed with reference: {payload.completion_reference}. Note: {payload.evidence_note or 'N/A'}"
    )
    db.add(event)
    db.commit()

    record_audit_event(
        db,
        action="REQUEST_RELEASE_COMPLETED",
        entity_type="RequestCase",
        entity_id=req.id,
        actor=current_user,
        after={"status": req.status, "completion_ref": req.completion_reference},
        reason="Administrative discharge completed and documented."
    )
    return req
