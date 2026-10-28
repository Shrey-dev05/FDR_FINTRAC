from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Institution
from app.schemas.schemas import LoginRequest, TokenResponse, UserOut
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator."
        )
    
    user.last_login_at = datetime.utcnow()
    db.commit()

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    inst_name = user.institution.legal_name if user.institution else None

    user_out = UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        institution_id=user.institution_id,
        institution_name=inst_name,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_out)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    inst_name = current_user.institution.legal_name if current_user.institution else None
    return UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        institution_id=current_user.institution_id,
        institution_name=inst_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out."}

@router.get("/demo-accounts")
def get_demo_accounts():
    """Returns the list of seeded demo accounts for quick role-switching in the UI."""
    return [
        {
            "role": "INSTITUTION_USER",
            "name": "Dr. Ramesh Sharma",
            "institution": "PNBC Institute of Technology (AICTE-DL-001)",
            "email": "institution@aicte-demo.in",
            "password": "Password@123",
            "description": "Can create drafts, submit FDRs, view own records, request renewals & releases."
        },
        {
            "role": "VERIFIER",
            "name": "Smt. Sunita Rao (Scrutiny Officer)",
            "institution": "AICTE Northern Regional Bureau",
            "email": "verifier@aicte-demo.in",
            "password": "Password@123",
            "description": "Can examine documents, compare OCR extraction, flag discrepancies, request clarifications, verify."
        },
        {
            "role": "APPROVING_AUTHORITY",
            "name": "Prof. Anil Sahasrabudhe (Approving Authority)",
            "institution": "AICTE Regulation Bureau HQ",
            "email": "approver@aicte-demo.in",
            "password": "Password@123",
            "description": "Reviews routed cases, approves/rejects release & renewal requests."
        },
        {
            "role": "ADMIN",
            "name": "System Administrator",
            "institution": "AICTE IT & Data Operations",
            "email": "admin@aicte-demo.in",
            "password": "Password@123",
            "description": "Manages users, system settings, runs reminder scheduler, inspects audit logs."
        },
        {
            "role": "AUDITOR",
            "name": "Shri V. Ramakrishnan (Senior Auditor)",
            "institution": "CAG / AICTE Audit Board",
            "email": "auditor@aicte-demo.in",
            "password": "Password@123",
            "description": "Read-only access to all verified records, document hashes, and immutable audit timeline."
        }
    ]
