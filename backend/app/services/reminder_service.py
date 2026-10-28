from datetime import datetime, date, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import FDRInstrument, Notification, BackgroundJobRun
from app.core.config import settings

def run_maturity_sweep(db: Session, target_date: date = None) -> Dict[str, Any]:
    """
    Idempotent maturity monitoring sweep.
    Scans active FDRs, calculates proximity to maturity_date, and emits
    targeted notifications with unique dedupe_keys so re-running produces zero duplicates.
    """
    if target_date is None:
        target_date = date.today()

    job_run = BackgroundJobRun(job_name="MATURITY_REMINDER_SWEEP", started_at=datetime.utcnow(), status="RUNNING")
    db.add(job_run)
    db.commit()

    processed_count = 0
    new_alerts_count = 0

    try:
        # Eligible instruments: active, verified, submitted or nearing renewal
        eligible_fdrs = db.query(FDRInstrument).filter(
            FDRInstrument.status.in_(["Verified / Active", "Renewal Pending", "Submitted", "Under Review"])
        ).all()

        for fdr in eligible_fdrs:
            processed_count += 1
            try:
                mat_date = datetime.strptime(fdr.maturity_date, "%Y-%m-%d").date()
            except ValueError:
                continue

            days_remaining = (mat_date - target_date).days

            alert_category = None
            title = ""
            msg = ""

            if days_remaining < 0:
                alert_category = "OVERDUE"
                title = f"CRITICAL: FDR {fdr.fdr_number} is Matured & Overdue"
                msg = f"Instrument {fdr.fdr_number} of {fdr.bank_name_snapshot} matured on {fdr.maturity_date} ({abs(days_remaining)} days ago). Urgent renewal or encashment action required."
                # Optionally mark status as Matured / Action Required if it was verified
                if fdr.status == "Verified / Active":
                    fdr.status = "Matured / Action Required"
            elif days_remaining == 0:
                alert_category = "MATURITY_DUE_TODAY"
                title = f"ALERT: FDR {fdr.fdr_number} Matures Today"
                msg = f"Instrument {fdr.fdr_number} for ₹{fdr.amount:,.2f} matures today ({fdr.maturity_date}). Submit renewal or release documentation."
            elif days_remaining <= 7:
                alert_category = "MATURITY_7_DAYS"
                title = f"Urgent: FDR {fdr.fdr_number} Matures in {days_remaining} Days"
                msg = f"Maturity on {fdr.maturity_date}. Please ensure replacement FDR draft is prepared."
            elif days_remaining <= 15:
                alert_category = "MATURITY_15_DAYS"
                title = f"Notice: FDR {fdr.fdr_number} Matures in {days_remaining} Days"
                msg = f"Instrument maturing on {fdr.maturity_date}. Contact issuing bank {fdr.bank_name_snapshot} for renewal deposit."
            elif days_remaining <= 30:
                alert_category = "MATURITY_30_DAYS"
                title = f"Upcoming Maturity: FDR {fdr.fdr_number} (30 Days)"
                msg = f"Security deposit FDR {fdr.fdr_number} approaches maturity on {fdr.maturity_date}."

            if alert_category:
                dedupe_key = f"{fdr.id}:{alert_category}:{mat_date.isoformat()}"
                
                # Check idempotency
                existing = db.query(Notification).filter(Notification.dedupe_key == dedupe_key).first()
                if not existing:
                    notif = Notification(
                        recipient_role="OFFICIAL",
                        institution_id=fdr.institution_id,
                        category=alert_category,
                        title=title,
                        message=msg,
                        entity_type="fdr",
                        entity_id=fdr.id,
                        channel="IN_APP",
                        delivery_status="SENT",
                        dedupe_key=dedupe_key
                    )
                    db.add(notif)
                    new_alerts_count += 1

        job_run.status = "COMPLETED"
        job_run.finished_at = datetime.utcnow()
        job_run.items_processed = processed_count
        db.commit()

        return {
            "job_id": job_run.id,
            "status": "COMPLETED",
            "items_processed": processed_count,
            "new_alerts_created": new_alerts_count,
            "target_date": target_date.isoformat()
        }
    except Exception as e:
        db.rollback()
        job_run.status = "FAILED"
        job_run.finished_at = datetime.utcnow()
        job_run.error_summary = str(e)
        db.commit()
        raise e
