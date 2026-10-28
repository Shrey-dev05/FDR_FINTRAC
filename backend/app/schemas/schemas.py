from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    institution_id: Optional[str] = None

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InstitutionCreate(BaseModel):
    institution_code: str
    legal_name: str
    institution_type: str = "Engineering & Technology"
    address: str
    state: str
    contact_email: EmailStr
    contact_phone: str

class InstitutionOut(BaseModel):
    id: str
    institution_code: str
    legal_name: str
    institution_type: str
    address: str
    state: str
    contact_email: str
    contact_phone: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BankOut(BaseModel):
    id: str
    bank_name: str
    branch_name: Optional[str] = None
    ifsc: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True

class FDRCreate(BaseModel):
    fdr_number: str
    bank_name: str
    bank_id: Optional[str] = None
    amount: float = Field(gt=0, description="Deposit amount must be strictly greater than 0")
    currency: str = "INR"
    issue_date: str
    maturity_date: str
    deposit_type: str = "Institutional Security Deposit"
    remarks: Optional[str] = None
    institution_id: Optional[str] = None # Filled from user context if institution user
    is_draft: bool = False

class FDRUpdate(BaseModel):
    fdr_number: Optional[str] = None
    bank_name: Optional[str] = None
    amount: Optional[float] = None
    issue_date: Optional[str] = None
    maturity_date: Optional[str] = None
    deposit_type: Optional[str] = None
    remarks: Optional[str] = None

class DocumentOut(BaseModel):
    id: str
    document_type: str
    original_filename: str
    mime_type: str
    size_bytes: int
    uploaded_by: str
    uploaded_at: datetime
    scan_status: str
    version: int

    class Config:
        from_attributes = True

class VerificationCheckOut(BaseModel):
    id: str
    check_type: str
    submitted_value: Optional[str] = None
    extracted_value: Optional[str] = None
    result: str
    evidence_source: str
    evidence_reference: Optional[str] = None
    checked_by: str
    checked_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ScrutinyObservationCreate(BaseModel):
    category: str = "MISMATCH"
    severity: str = "MEDIUM"
    message: str

class ScrutinyObservationOut(BaseModel):
    id: str
    author_id: str
    author_name: str
    category: str
    severity: str
    message: str
    status: str
    resolution_note: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ObservationResolveRequest(BaseModel):
    resolution_note: str

class FDRDetailOut(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    fdr_number: str
    normalized_reference: str
    bank_id: Optional[str] = None
    bank_name_snapshot: str
    amount: float
    currency: str
    issue_date: str
    maturity_date: str
    deposit_type: str
    status: str
    verification_status: str
    submitted_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    predecessor_instrument_id: Optional[str] = None
    successor_instrument_id: Optional[str] = None
    remarks: Optional[str] = None
    version: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentOut] = []
    checks: List[VerificationCheckOut] = []
    observations: List[ScrutinyObservationOut] = []

    class Config:
        from_attributes = True

class VerificationDecisionRequest(BaseModel):
    action: str  # "VERIFY", "FLAG_DISCREPANCY", "REQUEST_CLARIFICATION", "REJECT"
    reason: str
    evidence_reference: Optional[str] = None

class RenewalCreateRequest(BaseModel):
    fdr_number: str
    bank_name: str
    amount: float
    issue_date: str
    maturity_date: str
    remarks: Optional[str] = None

class RequestCreate(BaseModel):
    instrument_id: str
    request_type: str  # "RELEASE_REFUND", "RENEWAL_REPLACEMENT", "CLARIFICATION_RESPONSE"
    reason: str

class RequestDecision(BaseModel):
    decision: str  # "APPROVE", "REJECT", "RETURN_FOR_CLARIFICATION"
    decision_reason: str

class RequestComplete(BaseModel):
    completion_reference: str
    evidence_note: Optional[str] = None

class RequestOut(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    instrument_id: str
    fdr_number: Optional[str] = None
    amount: Optional[float] = None
    request_type: str
    status: str
    reason: str
    submitted_by: str
    submitted_at: datetime
    assigned_to: Optional[str] = None
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    decision_reason: Optional[str] = None
    completion_reference: Optional[str] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: str
    category: str
    title: str
    message: str
    entity_type: str
    entity_id: str
    channel: str
    delivery_status: str
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditEventOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    before_json: Optional[str] = None
    after_json: Optional[str] = None
    reason: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardSummaryOut(BaseModel):
    total_fdrs: int
    active_verified_count: int
    approaching_maturity_count: int
    verification_backlog_count: int
    overdue_count: int
    release_requests_pending_count: int
    total_deposit_value: float
    urgent_alerts: List[NotificationOut] = []
    maturity_horizon: dict = {}

class SystemSettingUpdate(BaseModel):
    value_json: str
