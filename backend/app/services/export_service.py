import io
import csv
from typing import List, Any

def escape_csv_field(val: Any) -> str:
    """Ensure safe spreadsheet rendering and prevent formula injection attacks (=, +, -, @)."""
    if val is None:
        return ""
    text = str(val).strip()
    if text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + text
    return text

def generate_fdr_csv(records: List[Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    headers = [
        "FDR Reference", "Institution Code", "Institution Legal Name", "Bank",
        "Amount (INR)", "Issue Date", "Maturity Date", "Status",
        "Verification Status", "Verified At", "Verified By"
    ]
    writer.writerow(headers)

    for item in records:
        inst_name = item.institution.legal_name if getattr(item, "institution", None) else ""
        inst_code = item.institution.institution_code if getattr(item, "institution", None) else ""
        writer.writerow([
            escape_csv_field(item.fdr_number),
            escape_csv_field(inst_code),
            escape_csv_field(inst_name),
            escape_csv_field(item.bank_name_snapshot),
            f"{item.amount:.2f}",
            escape_csv_field(item.issue_date),
            escape_csv_field(item.maturity_date),
            escape_csv_field(item.status),
            escape_csv_field(item.verification_status),
            escape_csv_field(item.verified_at.isoformat() if item.verified_at else ""),
            escape_csv_field(item.verified_by or "")
        ])

    return output.getvalue()

def generate_audit_csv(records: List[Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    headers = ["Timestamp (UTC)", "Actor", "Role", "Action", "Entity Type", "Entity ID", "Reason"]
    writer.writerow(headers)

    for ev in records:
        writer.writerow([
            escape_csv_field(ev.created_at.isoformat() if ev.created_at else ""),
            escape_csv_field(ev.actor_name),
            escape_csv_field(ev.actor_role),
            escape_csv_field(ev.action),
            escape_csv_field(ev.entity_type),
            escape_csv_field(ev.entity_id),
            escape_csv_field(ev.reason or "")
        ])

    return output.getvalue()
