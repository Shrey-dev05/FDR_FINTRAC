from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Institution, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("")
def list_institutions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insts = db.query(Institution).order_by(Institution.legal_name.asc()).all()
    return [
        {
            "id": i.id,
            "institution_code": i.institution_code,
            "legal_name": i.legal_name,
            "institution_type": i.institution_type,
            "address": i.address,
            "state": i.state,
            "contact_email": i.contact_email,
            "contact_phone": i.contact_phone,
            "status": i.status
        }
        for i in insts
    ]

@router.get("/{id}")
def get_institution(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found.")
    return {
        "id": inst.id,
        "institution_code": inst.institution_code,
        "legal_name": inst.legal_name,
        "institution_type": inst.institution_type,
        "address": inst.address,
        "state": inst.state,
        "contact_email": inst.contact_email,
        "contact_phone": inst.contact_phone,
        "status": inst.status
    }
