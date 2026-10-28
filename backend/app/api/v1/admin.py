from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Institution, AuditEvent, SystemSetting, BackgroundJobRun
from app.schemas.schemas import UserCreate, UserOut, AuditEventOut, SystemSettingUpdate
from app.core.security import get_password_hash
from app.core.deps import require_roles
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/users")
def list_users(
    current_user: User = Depends(require_roles(["ADMIN", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "institution_id": u.institution_id,
            "institution_name": u.institution.legal_name if u.institution else None,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "last_login_at": u.last_login_at
        }
        for u in users
    ]

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        institution_id=payload.institution_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit_event(
        db, action="CREATE_USER", entity_type="User", entity_id=new_user.id, actor=current_user,
        reason=f"Created account for {new_user.full_name} with role {new_user.role}"
    )
    return {"message": "User created successfully", "id": new_user.id}

@router.patch("/users/{id}/toggle-status")
def toggle_user_status(
    id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    target_user.is_active = not target_user.is_active
    db.commit()

    record_audit_event(
        db, action="TOGGLE_USER_STATUS", entity_type="User", entity_id=target_user.id, actor=current_user,
        reason=f"Status set to is_active={target_user.is_active}"
    )
    return {"message": "User status updated", "is_active": target_user.is_active}

@router.get("/audit-events")
def list_audit_events(
    entity_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(require_roles(["ADMIN", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    if action:
        query = query.filter(AuditEvent.action.ilike(f"%{action}%"))

    total = query.count()
    events = query.order_by(AuditEvent.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            {
                "id": e.id,
                "actor_id": e.actor_id,
                "actor_name": e.actor_name,
                "actor_role": e.actor_role,
                "action": e.action,
                "entity_type": e.entity_type,
                "entity_id": e.entity_id,
                "before_json": e.before_json,
                "after_json": e.after_json,
                "reason": e.reason,
                "created_at": e.created_at
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/settings")
def get_settings(
    current_user: User = Depends(require_roles(["ADMIN", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    settings_records = db.query(SystemSetting).all()
    return {s.key: s.value_json for s in settings_records}

@router.patch("/settings/{key}")
def update_setting(
    key: str,
    payload: SystemSettingUpdate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value_json=payload.value_json, updated_by=current_user.full_name)
        db.add(setting)
    else:
        setting.value_json = payload.value_json
        setting.updated_by = current_user.full_name
    db.commit()

    record_audit_event(
        db, action="UPDATE_SYSTEM_SETTING", entity_type="SystemSetting", entity_id=key, actor=current_user,
        reason=f"Setting {key} modified."
    )
    return {"message": "Setting updated successfully", "key": key}

@router.get("/jobs")
def get_job_runs(
    current_user: User = Depends(require_roles(["ADMIN", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    runs = db.query(BackgroundJobRun).order_by(BackgroundJobRun.started_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "job_name": r.job_name,
            "started_at": r.started_at,
            "finished_at": r.finished_at,
            "status": r.status,
            "items_processed": r.items_processed,
            "error_summary": r.error_summary
        }
        for r in runs
    ]
