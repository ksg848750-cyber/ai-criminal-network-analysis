import os
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from app.auth.deps import get_current_admin_user, TokenData
from app.validation.validator import validate_csv
from app.db.sqlite import log_audit
from app.ingestion.pipeline import run_ingestion_pipeline

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../../data/uploads")

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_admin_user)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    is_valid, errors = validate_csv(file_path)
    if not is_valid:
        log_audit(
            user_id=current_user.user_id,
            username=current_user.username,
            role=current_user.role,
            action="UPLOAD_FAILED",
            target_resource=file.filename,
            status="FAILURE",
            details=f"Validation errors: {errors}"
        )
        os.remove(file_path)
        raise HTTPException(status_code=400, detail={"message": "Validation failed", "errors": errors})
        
    log_audit(
        user_id=current_user.user_id,
        username=current_user.username,
        role=current_user.role,
        action="UPLOAD_SUCCESS",
        target_resource=file.filename,
        status="SUCCESS"
    )
    
    # Run pipeline
    try:
        result = run_ingestion_pipeline(filepath=file_path)
        return {"message": "Upload and ingestion successful", "result": result}
    except Exception as e:
        log_audit(
            user_id=current_user.user_id,
            username=current_user.username,
            role=current_user.role,
            action="INGEST_FAILED",
            target_resource=file.filename,
            status="FAILURE",
            details=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
