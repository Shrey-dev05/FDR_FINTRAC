import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(email: str, password: str = "Password@123") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_login_and_me():
    token = get_auth_token("verifier@aicte-demo.in")
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "verifier@aicte-demo.in"
    assert data["role"] == "VERIFIER"

def test_institution_scoping_idor_prevention():
    """Institution user must only see their own FDRs and CANNOT access other institutions."""
    inst_token = get_auth_token("institution@aicte-demo.in")
    
    # List own FDRs
    res = client.get("/api/v1/fdrs", headers={"Authorization": f"Bearer {inst_token}"})
    assert res.status_code == 200
    items = res.json()["items"]
    for it in items:
        # All items must belong to PNBC Institute of Technology
        assert it["institution_code"] == "AICTE-DL-001"

    # Try to access Central Polytechnic's FDR directly (from seed)
    admin_token = get_auth_token("admin@aicte-demo.in")
    admin_list = client.get("/api/v1/fdrs?search=PNB-SEC-2022-10884", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert len(admin_list["items"]) > 0
    other_fdr_id = admin_list["items"][0]["id"]

    # Institution user attempts to open other institution's FDR
    forbidden_res = client.get(f"/api/v1/fdrs/{other_fdr_id}", headers={"Authorization": f"Bearer {inst_token}"})
    assert forbidden_res.status_code == 403
    assert "Security policy violation" in forbidden_res.text

def test_fdr_date_and_amount_validation():
    token = get_auth_token("institution@aicte-demo.in")
    
    # 1. Negative amount test
    bad_amt = {
        "fdr_number": "BAD-AMT-001",
        "bank_name": "State Bank of India",
        "amount": -50000.0,
        "issue_date": "2026-01-01",
        "maturity_date": "2029-01-01",
        "is_draft": False
    }
    res1 = client.post("/api/v1/fdrs", json=bad_amt, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 422

    # 2. Inverted dates test (maturity earlier than issue date)
    bad_dates = {
        "fdr_number": "BAD-DATE-001",
        "bank_name": "State Bank of India",
        "amount": 1000000.0,
        "issue_date": "2026-05-01",
        "maturity_date": "2025-05-01",
        "is_draft": False
    }
    res2 = client.post("/api/v1/fdrs", json=bad_dates, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 422
    assert "later than Issue date" in res2.text

def test_idempotent_reminder_sweep():
    """Running maturity reminder sweep twice must produce zero duplicate alerts."""
    admin_token = get_auth_token("admin@aicte-demo.in")
    
    sweep1 = client.post("/api/v1/notifications/trigger-sweep", headers={"Authorization": f"Bearer {admin_token}"})
    assert sweep1.status_code == 200
    
    # Second immediate sweep
    sweep2 = client.post("/api/v1/notifications/trigger-sweep", headers={"Authorization": f"Bearer {admin_token}"})
    assert sweep2.status_code == 200
    # Must create 0 new alerts because all eligible alerts are already created with dedupe_key
    assert sweep2.json()["result"]["new_alerts_created"] == 0

def test_verification_decision_flow():
    verifier_token = get_auth_token("verifier@aicte-demo.in")
    queue_res = client.get("/api/v1/verification/queue", headers={"Authorization": f"Bearer {verifier_token}"})
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    assert len(queue_items) > 0
    target_fdr = queue_items[0]

    # Verify decision
    decision_payload = {
        "action": "VERIFY",
        "reason": "Scrutiny completed by AICTE regional desk. Physical FDR copy examined and verified against standard lien terms."
    }
    dec_res = client.post(f"/api/v1/verification/{target_fdr['id']}/decision", json=decision_payload, headers={"Authorization": f"Bearer {verifier_token}"})
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "Verified / Active"

def test_release_separation_of_duties_and_completion():
    inst_token = get_auth_token("institution@aicte-demo.in")
    approver_token = get_auth_token("approver@aicte-demo.in")

    # Get an active FDR for the institution
    inst_fdrs = client.get("/api/v1/fdrs", headers={"Authorization": f"Bearer {inst_token}"}).json()["items"]
    active_fdr = next(f for f in inst_fdrs if f["status"] == "Verified / Active")

    # Institution creates release request
    req_res = client.post("/api/v1/requests", json={
        "instrument_id": active_fdr["id"],
        "request_type": "RELEASE_REFUND",
        "reason": "Maturity completed and statutory lock-in period served."
    }, headers={"Authorization": f"Bearer {inst_token}"})
    assert req_res.status_code == 201
    request_id = req_res.json()["id"]

    # Submitter (Institution User) tries to approve own request -> MUST FAIL (separation of duties)
    self_approve = client.post(f"/api/v1/requests/{request_id}/decision", json={
        "decision": "APPROVE",
        "decision_reason": "I approve my own request"
    }, headers={"Authorization": f"Bearer {inst_token}"})
    assert self_approve.status_code == 403

    # Authorized Approver approves with mandatory reason
    appr_res = client.post(f"/api/v1/requests/{request_id}/decision", json={
        "decision": "APPROVE",
        "decision_reason": "Approved per AICTE Executive Committee Resolution 104/2026."
    }, headers={"Authorization": f"Bearer {approver_token}"})
    assert appr_res.status_code == 200

    # Completion without reference must fail
    bad_complete = client.post(f"/api/v1/requests/{request_id}/complete", json={
        "completion_reference": "",
        "evidence_note": "none"
    }, headers={"Authorization": f"Bearer {approver_token}"})
    assert bad_complete.status_code == 422

    # Completion with valid reference
    good_complete = client.post(f"/api/v1/requests/{request_id}/complete", json={
        "completion_reference": "DISCHARGE-REF-2026-99120",
        "evidence_note": "Bank lien revocation letter dispatched to bank manager."
    }, headers={"Authorization": f"Bearer {approver_token}"})
    assert good_complete.status_code == 200
    assert good_complete.json()["status"] == "Completed / Released"
