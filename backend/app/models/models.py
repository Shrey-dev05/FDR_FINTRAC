import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_code = Column(String(50), unique=True, nullable=False, index=True)
    legal_name = Column(String(255), nullable=False)
    institution_type = Column(String(100), default="Engineering & Technology")
    address = Column(Text, nullable=False)
    state = Column(String(100), nullable=False)
    contact_email = Column(String(150), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="institution")
    fdrs = relationship("FDRInstrument", back_populates="institution")
    requests = relationship("RequestCase", back_populates="institution")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # INSTITUTION_USER, VERIFIER, APPROVING_AUTHORITY, ADMIN, AUDITOR
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    institution = relationship("Institution", back_populates="users")

class Bank(Base):
    __tablename__ = "banks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bank_name = Column(String(150), nullable=False)
    branch_name = Column(String(150), nullable=True)
    ifsc = Column(String(50), nullable=True)
    provider_code = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)

class FDRInstrument(Base):
    __tablename__ = "fdr_instruments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    fdr_number = Column(String(100), nullable=False, index=True)
    normalized_reference = Column(String(100), nullable=False, index=True)
    bank_id = Column(String(36), ForeignKey("banks.id"), nullable=True)
    bank_name_snapshot = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)  # Stored as precise float/numeric
    currency = Column(String(10), default="INR")
    issue_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    maturity_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    deposit_type = Column(String(100), default="Institutional Security Deposit")
    status = Column(String(50), default="Draft", index=True)
    # Draft, Submitted, Under Review, Returned for Clarification, Discrepancy Flagged,
    # Verified / Active, Renewal Pending, Matured / Action Required, Replaced / Superseded,
    # Release Pending, Released / Closed
    verification_status = Column(String(50), default="Unverified") # Unverified, Pending Scrutiny, Verified, Discrepancy, Rejected
    submitted_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(150), nullable=True)
    predecessor_instrument_id = Column(String(36), nullable=True)
    successor_instrument_id = Column(String(36), nullable=True)
    remarks = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    created_by = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="fdrs")
    documents = relationship("Document", back_populates="fdr", cascade="all, delete-orphan")
    checks = relationship("VerificationCheck", back_populates="fdr", cascade="all, delete-orphan")
    observations = relationship("ScrutinyObservation", back_populates="fdr", cascade="all, delete-orphan")
    requests = relationship("RequestCase", back_populates="fdr")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    instrument_id = Column(String(36), ForeignKey("fdr_instruments.id"), nullable=True, index=True)
    request_id = Column(String(36), nullable=True, index=True)
    document_type = Column(String(50), nullable=False)  # FDR_SCAN, BANK_LETTER, RELEASE_EVIDENCE, RENEWAL_ADVICE
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=True)
    uploaded_by = Column(String(150), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    version = Column(Integer, default=1)
    scan_status = Column(String(50), default="CLEAN")  # CLEAN, SCANNING, REJECTED

    fdr = relationship("FDRInstrument", back_populates="documents")

class VerificationCheck(Base):
    __tablename__ = "verification_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    instrument_id = Column(String(36), ForeignKey("fdr_instruments.id"), nullable=False, index=True)
    check_type = Column(String(50), nullable=False)  # OCR_EXTRACTION, BANK_CONFIRMATION, DUPLICATE_CHECK, DATE_SEQUENCE
    submitted_value = Column(Text, nullable=True)
    extracted_value = Column(Text, nullable=True)
    result = Column(String(50), nullable=False)  # PASS, FAIL, DISCREPANCY, PENDING
    evidence_source = Column(String(100), default="DEMO_OCR")  # DEMO_OCR, DEMO_BANK_ADAPTER, MANUAL_AUDIT
    evidence_reference = Column(String(100), nullable=True)
    checked_by = Column(String(150), nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    fdr = relationship("FDRInstrument", back_populates="checks")

class ScrutinyObservation(Base):
    __tablename__ = "scrutiny_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    instrument_id = Column(String(36), ForeignKey("fdr_instruments.id"), nullable=False, index=True)
    author_id = Column(String(150), nullable=False)
    author_name = Column(String(150), nullable=False)
    category = Column(String(50), default="MISMATCH")  # MISMATCH, MISSING_DATA, DATE_ANOMALY, CLARIFICATION
    severity = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, RESOLVED
    resolution_note = Column(Text, nullable=True)
    resolved_by = Column(String(150), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fdr = relationship("FDRInstrument", back_populates="observations")

class RequestCase(Base):
    __tablename__ = "requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    instrument_id = Column(String(36), ForeignKey("fdr_instruments.id"), nullable=False, index=True)
    request_type = Column(String(50), nullable=False)  # RELEASE_REFUND, RENEWAL_REPLACEMENT, CLARIFICATION_RESPONSE
    status = Column(String(50), default="Submitted", index=True)
    # Submitted, Under Scrutiny, Returned for Clarification, Under Decision, Approved, Rejected, Completed / Released
    reason = Column(Text, nullable=False)
    submitted_by = Column(String(150), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    assigned_to = Column(String(150), nullable=True)
    decided_by = Column(String(150), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decision_reason = Column(Text, nullable=True)
    completion_reference = Column(String(150), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="requests")
    fdr = relationship("FDRInstrument", back_populates="requests")
    events = relationship("RequestEvent", back_populates="request", cascade="all, delete-orphan")

class RequestEvent(Base):
    __tablename__ = "request_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("requests.id"), nullable=False, index=True)
    actor_id = Column(String(150), nullable=False)
    actor_name = Column(String(150), nullable=False)
    event_type = Column(String(50), nullable=False)  # SUBMIT, SCRUTINY, DECIDE, COMPLETE, CLARIFY
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("RequestCase", back_populates="events")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_user_id = Column(String(150), nullable=True)
    recipient_role = Column(String(50), nullable=True)
    institution_id = Column(String(36), nullable=True)
    category = Column(String(50), nullable=False)  # MATURITY_30_DAYS, MATURITY_15_DAYS, MATURITY_7_DAYS, OVERDUE, VERIFICATION_TASK, CLARIFICATION, REQUEST_STATUS
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(50), default="fdr")
    entity_id = Column(String(50), nullable=False)
    channel = Column(String(50), default="IN_APP")
    delivery_status = Column(String(50), default="SENT")  # SENT, FAILED_SIMULATED
    read_at = Column(DateTime, nullable=True)
    dedupe_key = Column(String(150), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(150), nullable=True)
    actor_name = Column(String(150), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    before_json = Column(Text, nullable=True)
    after_json = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    request_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value_json = Column(Text, nullable=False)
    updated_by = Column(String(150), default="SYSTEM")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BackgroundJobRun(Base):
    __tablename__ = "background_job_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_name = Column(String(100), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="RUNNING")  # RUNNING, COMPLETED, FAILED
    items_processed = Column(Integer, default=0)
    error_summary = Column(Text, nullable=True)
