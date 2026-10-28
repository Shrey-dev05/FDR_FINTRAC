import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.models import AuditEvent, User

def record_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    actor: Optional[User] = None,
    before: Optional[Any] = None,
    after: Optional[Any] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> AuditEvent:
    before_json = None
    after_json = None
    if before is not None:
        try:
            before_json = json.dumps(before, default=str)
        except Exception:
            before_json = str(before)
    if after is not None:
        try:
            after_json = json.dumps(after, default=str)
        except Exception:
            after_json = str(after)

    event = AuditEvent(
        actor_id=actor.id if actor else "SYSTEM",
        actor_name=actor.full_name if actor else "System Automated Process",
        actor_role=actor.role if actor else "SYSTEM",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=before_json,
        after_json=after_json,
        reason=reason,
        ip_address=ip_address,
        request_id=request_id
    )
    db.add(event)
    db.commit()
    return event
