from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.models import FDRInstrument, RequestCase, Notification, AuditEvent, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    in_7_days = today + timedelta(days=7)
    in_30_days = today + timedelta(days=30)
    in_90_days = today + timedelta(days=90)

    # Base FDR query scoped by user role
    query = db.query(FDRInstrument)
    if current_user.role == "INSTITUTION_USER":
        query = query.filter(FDRInstrument.institution_id == current_user.institution_id)

    all_fdrs = query.all()
    total_fdrs = len(all_fdrs)
    total_amount = sum(f.amount for f in all_fdrs)

    active_count = sum(1 for f in all_fdrs if f.status == "Verified / Active")
    backlog_count = sum(1 for f in all_fdrs if f.status in ["Submitted", "Under Review"])
    clarification_count = sum(1 for f in all_fdrs if f.status in ["Returned for Clarification", "Discrepancy Flagged"])
    
    # Maturity horizon calculations
    overdue_count = 0
    due_today_count = 0
    due_7_days_count = 0
    due_30_days_count = 0
    due_90_days_count = 0

    for f in all_fdrs:
        if f.status in ["Verified / Active", "Submitted", "Under Review", "Renewal Pending", "Matured / Action Required"]:
            try:
                m_date = datetime.strptime(f.maturity_date, "%Y-%m-%d").date()
                if m_date < today:
                    overdue_count += 1
                elif m_date == today:
                    due_today_count += 1
                elif m_date <= in_7_days:
                    due_7_days_count += 1
                elif m_date <= in_30_days:
                    due_30_days_count += 1
                elif m_date <= in_90_days:
                    due_90_days_count += 1
            except ValueError:
                pass

    # Requests query
    req_query = db.query(RequestCase)
    if current_user.role == "INSTITUTION_USER":
        req_query = req_query.filter(RequestCase.institution_id == current_user.institution_id)
    all_requests = req_query.all()
    pending_releases = sum(1 for r in all_requests if r.request_type == "RELEASE_REFUND" and r.status in ["Submitted", "Under Scrutiny", "Under Decision", "Approved"])

    # Urgent notifications
    notif_query = db.query(Notification)
    if current_user.role == "INSTITUTION_USER":
        notif_query = notif_query.filter(Notification.institution_id == current_user.institution_id)
    urgent_alerts = notif_query.order_by(Notification.created_at.desc()).limit(5).all()

    # Recent activity
    recent_activity = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(8).all()

    return {
        "user_role": current_user.role,
        "total_fdrs": total_fdrs,
        "total_amount": total_amount,
        "active_verified_count": active_count,
        "verification_backlog_count": backlog_count,
        "clarification_count": clarification_count,
        "overdue_count": overdue_count,
        "due_today_count": due_today_count,
        "approaching_maturity_count": due_7_days_count + due_30_days_count,
        "release_requests_pending_count": pending_releases,
        "maturity_horizon": {
            "overdue": overdue_count,
            "due_today": due_today_count,
            "next_7_days": due_7_days_count,
            "next_30_days": due_30_days_count,
            "next_90_days": due_90_days_count,
        },
        "urgent_alerts": [
            {
                "id": n.id,
                "category": n.category,
                "title": n.title,
                "message": n.message,
                "entity_id": n.entity_id,
                "created_at": n.created_at
            }
            for n in urgent_alerts
        ],
        "recent_activity": [
            {
                "id": a.id,
                "actor_name": a.actor_name,
                "actor_role": a.actor_role,
                "action": a.action,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "reason": a.reason,
                "created_at": a.created_at
            }
            for a in recent_activity
        ]
    }
