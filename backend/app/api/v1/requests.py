from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import RequestCase, RequestEvent, FDRInstrument, Institution, User
from app.schemas.schemas import RequestCreate, RequestDecision, RequestComplete
from app.core.deps import get_current_user, require_roles, verify_institution_scope
from app.services.request_service import (
    create_request_case, process_request_decision, complete_release_request
)

router = APIRouter(prefix="/requests", tags=["Requests & Cases"])

@router.get("")
def list_requests(
    request_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(RequestCase)
    if current_user.role == "INSTITUTION_USER":
        query = query.filter(RequestCase.institution_id == current_user.institution_id)

    if request_type and request_type != "ALL":
        query = query.filter(RequestCase.request_type == request_type)
    if status_filter and status_filter != "ALL":
        query = query.filter(RequestCase.status == status_filter)

    results = query.order_by(RequestCase.submitted_at.desc()).all()

    return [
        {
            "id": r.id,
            "institution_id": r.institution_id,
            "institution_name": r.institution.legal_name if r.institution else "",
            "institution_code": r.institution.institution_code if r.institution else "",
            "instrument_id": r.instrument_id,
            "fdr_number": r.fdr.fdr_number if r.fdr else "",
            "amount": r.fdr.amount if r.fdr else 0.0,
            "bank_name": r.fdr.bank_name_snapshot if r.fdr else "",
            "request_type": r.request_type,
            "status": r.status,
            "reason": r.reason,
            "submitted_by": r.submitted_by,
            "submitted_at": r.submitted_at,
            "assigned_to": r.assigned_to,
            "decided_by": r.decided_by,
            "decided_at": r.decided_at,
            "decision_reason": r.decision_reason,
            "completion_reference": r.completion_reference,
            "completed_at": r.completed_at
        }
        for r in results
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_request(
    payload: RequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = create_request_case(db, payload, current_user)
    return {"message": "Request submitted successfully", "id": req.id, "status": req.status}

@router.get("/{id}")
def get_request_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(RequestCase).filter(RequestCase.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    verify_institution_scope(current_user, req.institution_id)

    events = db.query(RequestEvent).filter(RequestEvent.request_id == req.id).order_by(RequestEvent.created_at.asc()).all()

    return {
        "id": req.id,
        "institution_id": req.institution_id,
        "institution_name": req.institution.legal_name if req.institution else "",
        "instrument_id": req.instrument_id,
        "fdr_number": req.fdr.fdr_number if req.fdr else "",
        "amount": req.fdr.amount if req.fdr else 0.0,
        "bank_name": req.fdr.bank_name_snapshot if req.fdr else "",
        "fdr_status": req.fdr.status if req.fdr else "",
        "request_type": req.request_type,
        "status": req.status,
        "reason": req.reason,
        "submitted_by": req.submitted_by,
        "submitted_at": req.submitted_at,
        "decided_by": req.decided_by,
        "decided_at": req.decided_at,
        "decision_reason": req.decision_reason,
        "completion_reference": req.completion_reference,
        "completed_at": req.completed_at,
        "events": [
            {
                "id": e.id,
                "actor_name": e.actor_name,
                "event_type": e.event_type,
                "from_status": e.from_status,
                "to_status": e.to_status,
                "comment": e.comment,
                "created_at": e.created_at
            }
            for e in events
        ]
    }

@router.post("/{id}/decision")
def make_decision(
    id: str,
    payload: RequestDecision,
    current_user: User = Depends(require_roles(["APPROVING_AUTHORITY", "ADMIN"])),
    db: Session = Depends(get_db)
):
    req = process_request_decision(db, id, payload, current_user)
    return {"message": f"Request {payload.decision} recorded", "id": req.id, "status": req.status}

@router.post("/{id}/complete")
def complete_request(
    id: str,
    payload: RequestComplete,
    current_user: User = Depends(require_roles(["APPROVING_AUTHORITY", "ADMIN", "VERIFIER"])),
    db: Session = Depends(get_db)
):
    req = complete_release_request(db, id, payload, current_user)
    return {"message": "Release workflow completed and documented", "id": req.id, "status": req.status}
