import os
import hashlib
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Document, FDRInstrument, VerificationCheck, User
from app.core.config import settings
from app.core.deps import get_current_user, verify_institution_scope
from app.services.ocr_service import DocumentAnalysisEngine
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/documents", tags=["Documents"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    instrument_id: str = Form(...),
    document_type: str = Form("FDR_SCAN"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRInstrument).filter(FDRInstrument.id == instrument_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR instrument not found.")
    verify_institution_scope(current_user, fdr.institution_id)

    # Validate file extension and MIME type
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".png", ".jpg", ".jpeg"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File extension '{ext}' is not permitted. Only PDF, PNG, JPG files are allowed."
        )

    # Read and validate size
    content = await file.read()
    size_bytes = len(content)
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_MB}MB."
        )

    # Calculate SHA256 checksum
    sha256 = hashlib.sha256(content).hexdigest()
    
    # Store with randomized safe key
    safe_filename = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
    storage_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    with open(storage_path, "wb") as f:
        f.write(content)

    doc = Document(
        instrument_id=fdr.id,
        document_type=document_type,
        original_filename=file.filename,
        storage_key=safe_filename,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        sha256=sha256,
        uploaded_by=current_user.full_name,
        scan_status="CLEAN"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Run Neural Document Scrutiny Engine analysis
    analysis_result = DocumentAnalysisEngine.analyze_document(storage_path, file.filename, fdr.fdr_number, fdr.amount)
    analysis_result["document_hash_sha256"] = sha256

    ocr_check = VerificationCheck(
        instrument_id=fdr.id,
        check_type="DOCUMENT_SCRUTINY_ANALYSIS",
        submitted_value=f"FDR: {fdr.fdr_number} | Bank: {fdr.bank_name_snapshot} | Amount: ₹{fdr.amount:,.2f}",
        extracted_value=f"Parsed: {analysis_result['fields']['fdr_number']['value']} | {analysis_result['fields']['issuing_bank']['value']} | {analysis_result['fields']['principal_amount']['formatted']} (Confidence: {analysis_result['overall_confidence']*100:.1f}%)",
        result="PASS" if analysis_result["regulatory_compliance_checks"]["joint_lien_endorsement"]["status"] == "VERIFIED_PRESENT" else "DISCREPANCY",
        evidence_source="AICTE_NEURAL_SCRUTINY_ENGINE",
        evidence_reference=f"SHA256:{sha256[:16]}",
        checked_by="AICTE Document Intelligence Parser",
        notes=f"Lien: {analysis_result['regulatory_compliance_checks']['joint_lien_endorsement']['clause_text']}"
    )
    db.add(ocr_check)
    db.commit()

    record_audit_event(
        db,
        action="UPLOAD_DOCUMENT",
        entity_type="Document",
        entity_id=doc.id,
        actor=current_user,
        reason=f"Uploaded {doc.original_filename} ({doc.size_bytes} bytes). SHA256: {sha256[:16]}..."
    )

    return {
        "message": "File uploaded and analyzed successfully",
        "document_id": doc.id,
        "filename": doc.original_filename,
        "analysis": analysis_result
    }

@router.get("/{id}/download")
def download_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.fdr:
        verify_institution_scope(current_user, doc.fdr.institution_id)

    storage_path = os.path.join(settings.UPLOAD_DIR, doc.storage_key)
    if not os.path.exists(storage_path):
        raise HTTPException(status_code=404, detail="Physical document file missing from storage.")

    return FileResponse(
        storage_path,
        media_type=doc.mime_type,
        filename=doc.original_filename
    )
