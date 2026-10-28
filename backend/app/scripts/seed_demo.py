import os
import uuid
from datetime import datetime, date, timedelta
from app.db.session import SessionLocal, Base, engine
from app.models.models import (
    Institution, User, Bank, FDRInstrument, Document, VerificationCheck,
    ScrutinyObservation, RequestCase, RequestEvent, Notification, AuditEvent,
    SystemSetting, BackgroundJobRun
)
from app.core.security import get_password_hash
from app.services.reminder_service import run_maturity_sweep

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # If already seeded with users, skip
    if db.query(User).count() > 0:
        print("[SEED] Database already contains records. Skipping seed.")
        db.close()
        return

    print("[SEED] Seeding AICTE Security Deposit / FDR Portal demo records...")

    # 1. Institutions
    inst_abc = Institution(
        id=str(uuid.uuid4()),
        institution_code="AICTE-DL-001",
        legal_name="PNBC Institute of Technology",
        institution_type="Engineering & Technology",
        address="Sector 12, Dwarka, New Delhi 110078",
        state="Delhi",
        contact_email="principal@pnbctech.edu.in",
        contact_phone="+91-11-28080001",
        status="Active"
    )
    inst_poly = Institution(
        id=str(uuid.uuid4()),
        institution_code="AICTE-MH-042",
        legal_name="Central Polytechnic College",
        institution_type="Polytechnic & Diploma",
        address="Shivajinagar, Pune 411005",
        state="Maharashtra",
        contact_email="director@centralpoly.ac.in",
        contact_phone="+91-20-25500042",
        status="Active"
    )
    inst_sun = Institution(
        id=str(uuid.uuid4()),
        institution_code="AICTE-KA-109",
        legal_name="Sunrise College of Engineering",
        institution_type="Engineering & Technology",
        address="Electronic City Phase 1, Bengaluru 560100",
        state="Karnataka",
        contact_email="admin@sunrise.edu.in",
        contact_phone="+91-80-41234567",
        status="Active"
    )
    db.add_all([inst_abc, inst_poly, inst_sun])
    db.commit()

    # 2. Banks
    bank_sbi = Bank(bank_name="State Bank of India", branch_name="New Delhi Main Branch", ifsc="SBIN0000691", active=True)
    bank_hdfc = Bank(bank_name="HDFC Bank", branch_name="Kasturba Gandhi Marg", ifsc="HDFC0000003", active=True)
    bank_pnb = Bank(bank_name="Punjab National Bank", branch_name="Parliament Street", ifsc="PUNB0102000", active=True)
    bank_canara = Bank(bank_name="Canara Bank", branch_name="Connaught Circus", ifsc="CNRB0000101", active=True)
    db.add_all([bank_sbi, bank_hdfc, bank_pnb, bank_canara])
    db.commit()

    # 3. Users for each role
    pwd = get_password_hash("Password@123")
    user_inst = User(
        id=str(uuid.uuid4()),
        full_name="Dr. Ramesh Sharma",
        email="institution@aicte-demo.in",
        password_hash=pwd,
        role="INSTITUTION_USER",
        institution_id=inst_abc.id,
        is_active=True
    )
    user_verifier = User(
        id=str(uuid.uuid4()),
        full_name="Smt. Sunita Rao",
        email="verifier@aicte-demo.in",
        password_hash=pwd,
        role="VERIFIER",
        is_active=True
    )
    user_approver = User(
        id=str(uuid.uuid4()),
        full_name="Prof. Anil Sahasrabudhe",
        email="approver@aicte-demo.in",
        password_hash=pwd,
        role="APPROVING_AUTHORITY",
        is_active=True
    )
    user_admin = User(
        id=str(uuid.uuid4()),
        full_name="System Administrator",
        email="admin@aicte-demo.in",
        password_hash=pwd,
        role="ADMIN",
        is_active=True
    )
    user_auditor = User(
        id=str(uuid.uuid4()),
        full_name="Shri V. Ramakrishnan",
        email="auditor@aicte-demo.in",
        password_hash=pwd,
        role="AUDITOR",
        is_active=True
    )
    db.add_all([user_inst, user_verifier, user_approver, user_admin, user_auditor])
    db.commit()

    today = date.today()
    mat_in_7 = (today + timedelta(days=6)).isoformat()
    mat_in_20 = (today + timedelta(days=20)).isoformat()
    mat_in_3yr = (today + timedelta(days=1095)).isoformat()
    mat_overdue = (today - timedelta(days=14)).isoformat()
    issue_past = (today - timedelta(days=730)).isoformat()

    # 4. FDR Instruments representing each distinct state
    # 1: Verified / Active with far future maturity
    fdr_active = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_abc.id,
        fdr_number="SBI-FDR-2024-88910",
        normalized_reference="SBIFDR202488910",
        bank_name_snapshot="State Bank of India",
        amount=3500000.0,
        currency="INR",
        issue_date=issue_past,
        maturity_date=mat_in_3yr,
        deposit_type="Establishment Security Deposit",
        status="Verified / Active",
        verification_status="Verified",
        submitted_at=datetime.utcnow() - timedelta(days=120),
        verified_at=datetime.utcnow() - timedelta(days=118),
        verified_by="Smt. Sunita Rao",
        created_by="Dr. Ramesh Sharma"
    )

    # 2: Maturing in 6 days (Approaching Deadline)
    fdr_near_mat = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_abc.id,
        fdr_number="HDFC-DEP-2023-45129",
        normalized_reference="HDFCDEP202345129",
        bank_name_snapshot="HDFC Bank",
        amount=2500000.0,
        currency="INR",
        issue_date=issue_past,
        maturity_date=mat_in_7,
        deposit_type="Course Expansion Deposit",
        status="Verified / Active",
        verification_status="Verified",
        submitted_at=datetime.utcnow() - timedelta(days=365),
        verified_at=datetime.utcnow() - timedelta(days=363),
        verified_by="Smt. Sunita Rao",
        created_by="Dr. Ramesh Sharma"
    )

    # 3: Matured and Overdue
    fdr_overdue = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_poly.id,
        fdr_number="PNB-SEC-2022-10884",
        normalized_reference="PNBSEC202210884",
        bank_name_snapshot="Punjab National Bank",
        amount=1500000.0,
        currency="INR",
        issue_date=(today - timedelta(days=1095)).isoformat(),
        maturity_date=mat_overdue,
        deposit_type="Institutional Security Deposit",
        status="Matured / Action Required",
        verification_status="Verified",
        submitted_at=datetime.utcnow() - timedelta(days=400),
        verified_at=datetime.utcnow() - timedelta(days=398),
        verified_by="Smt. Sunita Rao",
        created_by="Central Polytechnic Admin"
    )

    # 4: Submitted / Pending Scrutiny
    fdr_pending = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_sun.id,
        fdr_number="CAN-FDR-2026-99201",
        normalized_reference="CANFDR202699201",
        bank_name_snapshot="Canara Bank",
        amount=5000000.0,
        currency="INR",
        issue_date=today.isoformat(),
        maturity_date=mat_in_3yr,
        deposit_type="New Polytechnic Programme Deposit",
        status="Submitted",
        verification_status="Pending Scrutiny",
        submitted_at=datetime.utcnow() - timedelta(hours=18),
        created_by="Sunrise College Admin"
    )

    # 5: Discrepancy Flagged
    fdr_disc = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_abc.id,
        fdr_number="SBI-FDR-2026-33012",
        normalized_reference="SBIFDR202633012",
        bank_name_snapshot="State Bank of India",
        amount=2000000.0,
        currency="INR",
        issue_date=today.isoformat(),
        maturity_date=mat_in_20,
        deposit_type="Joint AICTE-Trust FDR",
        status="Discrepancy Flagged",
        verification_status="Discrepancy",
        submitted_at=datetime.utcnow() - timedelta(days=3),
        created_by="Dr. Ramesh Sharma"
    )

    # 6 & 7: Predecessor and Successor (Renewal flow)
    pred_fdr = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_abc.id,
        fdr_number="HDFC-DEP-2021-00100",
        normalized_reference="HDFCDEP202100100",
        bank_name_snapshot="HDFC Bank",
        amount=2500000.0,
        currency="INR",
        issue_date=(today - timedelta(days=1200)).isoformat(),
        maturity_date=(today - timedelta(days=100)).isoformat(),
        deposit_type="Institutional Security Deposit",
        status="Replaced / Superseded",
        verification_status="Verified",
        submitted_at=datetime.utcnow() - timedelta(days=1100),
        verified_at=datetime.utcnow() - timedelta(days=1098),
        verified_by="Smt. Sunita Rao",
        created_by="Dr. Ramesh Sharma"
    )
    succ_fdr = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_abc.id,
        fdr_number="HDFC-DEP-2024-00101-RENEW",
        normalized_reference="HDFCDEP202400101RENEW",
        bank_name_snapshot="HDFC Bank",
        amount=2500000.0,
        currency="INR",
        issue_date=(today - timedelta(days=95)).isoformat(),
        maturity_date=(today + timedelta(days=1000)).isoformat(),
        deposit_type="Institutional Security Deposit",
        status="Verified / Active",
        verification_status="Verified",
        predecessor_instrument_id=pred_fdr.id,
        submitted_at=datetime.utcnow() - timedelta(days=90),
        verified_at=datetime.utcnow() - timedelta(days=88),
        verified_by="Smt. Sunita Rao",
        created_by="Dr. Ramesh Sharma"
    )
    pred_fdr.successor_instrument_id = succ_fdr.id

    # 8: Released / Closed FDR
    fdr_released = FDRInstrument(
        id=str(uuid.uuid4()),
        institution_id=inst_poly.id,
        fdr_number="PNB-SEC-2018-77112",
        normalized_reference="PNBSEC201877112",
        bank_name_snapshot="Punjab National Bank",
        amount=1000000.0,
        currency="INR",
        issue_date=(today - timedelta(days=2000)).isoformat(),
        maturity_date=(today - timedelta(days=500)).isoformat(),
        deposit_type="Course Closure Security Refund",
        status="Released / Closed",
        verification_status="Verified",
        submitted_at=datetime.utcnow() - timedelta(days=600),
        verified_at=datetime.utcnow() - timedelta(days=595),
        verified_by="Smt. Sunita Rao",
        created_by="Central Polytechnic Admin"
    )

    db.add_all([fdr_active, fdr_near_mat, fdr_overdue, fdr_pending, fdr_disc, pred_fdr, succ_fdr, fdr_released])
    db.commit()

    # 5. Documents for the FDRs
    doc1 = Document(
        instrument_id=fdr_pending.id,
        document_type="FDR_SCAN",
        original_filename="Canara_Bank_Fixed_Deposit_Receipt_99201.pdf",
        storage_key="sample_canara_fdr.pdf",
        mime_type="application/pdf",
        size_bytes=1048576,
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        uploaded_by="Sunrise College Admin",
        scan_status="CLEAN"
    )
    doc2 = Document(
        instrument_id=fdr_disc.id,
        document_type="FDR_SCAN",
        original_filename="SBI_Joint_Deposit_Receipt_33012.pdf",
        storage_key="sample_sbi_fdr.pdf",
        mime_type="application/pdf",
        size_bytes=2097152,
        sha256="4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        uploaded_by="Dr. Ramesh Sharma",
        scan_status="CLEAN"
    )
    db.add_all([doc1, doc2])
    db.commit()

    # 6. Scrutiny Observation for the Discrepancy FDR
    obs = ScrutinyObservation(
        instrument_id=fdr_disc.id,
        author_id=user_verifier.id,
        author_name=user_verifier.full_name,
        category="MISMATCH",
        severity="HIGH",
        message="The deposit receipt names 'PNBC Trust' as sole beneficiary rather than joint lien in favour of AICTE Member Secretary. Mandated joint lien clause missing.",
        status="OPEN"
    )
    db.add(obs)
    db.commit()

    # 7. Verification checks
    check_ocr = VerificationCheck(
        instrument_id=fdr_pending.id,
        check_type="OCR_EXTRACTION",
        submitted_value="FDR: CAN-FDR-2026-99201 | ₹50,00,000.00",
        extracted_value="Extracted: CAN-FDR-2026-99201 | ₹50,00,000.00 (98% Conf)",
        result="PASS",
        evidence_source="DEMO_OCR (Simulated)",
        evidence_reference="SHA256:e3b0c44298",
        checked_by="SYSTEM (OCR Engine)",
        notes="Document OCR suggests exact match with submitted receipt metadata."
    )
    check_seq = VerificationCheck(
        instrument_id=fdr_pending.id,
        check_type="DATE_SEQUENCE",
        submitted_value=f"Issue: {today.isoformat()} -> Maturity: {mat_in_3yr}",
        extracted_value="Valid sequence (1095 days duration)",
        result="PASS",
        evidence_source="RULE_ENGINE",
        checked_by="SYSTEM",
        notes="Deposit term conforms to AICTE 3-year minimum lock-in guidelines."
    )
    db.add_all([check_ocr, check_seq])
    db.commit()

    # 8. Release Request Case
    req_release = RequestCase(
        institution_id=inst_abc.id,
        instrument_id=fdr_near_mat.id,
        request_type="RELEASE_REFUND",
        status="Under Decision",
        reason="Institution has operated in compliance for 10 consecutive years. Requesting partial security deposit encashment per Chapter 1 Section 4 of AICTE APH 2026-27.",
        submitted_by="Dr. Ramesh Sharma"
    )
    db.add(req_release)
    db.commit()

    req_event = RequestEvent(
        request_id=req_release.id,
        actor_id=user_inst.id,
        actor_name=user_inst.full_name,
        event_type="SUBMIT",
        from_status="None",
        to_status="Submitted",
        comment="Original application submitted with chartered accountant audit statement."
    )
    req_event2 = RequestEvent(
        request_id=req_release.id,
        actor_id=user_verifier.id,
        actor_name=user_verifier.full_name,
        event_type="SCRUTINY",
        from_status="Submitted",
        to_status="Under Decision",
        comment="Documents scrutinized. Eligibility criteria verified. Forwarded to Approving Authority for final administrative order."
    )
    db.add_all([req_event, req_event2])
    db.commit()

    # 9. System settings
    set1 = SystemSetting(key="REMINDER_WINDOWS_DAYS", value_json="[30, 15, 7, 0]", updated_by="SYSTEM")
    set2 = SystemSetting(key="MAX_UPLOAD_MB", value_json="15", updated_by="SYSTEM")
    set3 = SystemSetting(key="BANK_VERIFIER_MODE", value_json='"DEMO"', updated_by="SYSTEM")
    db.add_all([set1, set2, set3])
    db.commit()

    # 10. Run initial maturity sweep to generate notifications
    sweep_res = run_maturity_sweep(db)
    print(f"[SEED] Initial maturity sweep executed: {sweep_res['new_alerts_created']} alerts generated.")

    print("[SEED] Demo data seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
