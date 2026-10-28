from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Notification, User
from app.core.deps import get_current_user
from app.services.reminder_service import run_maturity_sweep

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def list_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if current_user.role == "INSTITUTION_USER":
        query = query.filter(Notification.institution_id == current_user.institution_id)
    
    if unread_only:
        query = query.filter(Notification.read_at.is_(None))

    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = query.filter(Notification.read_at.is_(None)).count()

    return {
        "unread_count": unread_count,
        "items": [
            {
                "id": n.id,
                "category": n.category,
                "title": n.title,
                "message": n.message,
                "entity_type": n.entity_type,
                "entity_id": n.entity_id,
                "delivery_status": n.delivery_status,
                "read_at": n.read_at,
                "created_at": n.created_at
            }
            for n in notifications
        ]
    }

@router.post("/{id}/read")
def mark_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    n = db.query(Notification).filter(Notification.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    n.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Notification marked as read", "id": id}

@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if current_user.role == "INSTITUTION_USER":
        query = query.filter(Notification.institution_id == current_user.institution_id)
    
    now = datetime.utcnow()
    query.filter(Notification.read_at.is_(None)).update({"read_at": now})
    db.commit()
    return {"message": "All notifications marked as read."}

@router.post("/trigger-sweep")
def trigger_sweep_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin or official can trigger the idempotent reminder sweep immediately."""
    result = run_maturity_sweep(db)
    return {"message": "Maturity reminder sweep executed successfully.", "result": result}
