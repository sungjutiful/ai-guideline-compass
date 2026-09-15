from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.guideline import GuidelineDocument
from app.models.user import User, UserRole
from app.schemas.guideline import GuidelineDocumentRead, GuidelineUploadResponse
from app.services.rag.ingest import extract_text, ingest_document

router = APIRouter(prefix="/guidelines", tags=["guidelines"])


@router.post(
    "/upload", response_model=GuidelineUploadResponse, status_code=status.HTTP_201_CREATED
)
def upload_guideline(
    title: str = Form(...),
    source: str = Form(...),
    version: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.teacher, UserRole.admin)),
):
    raw_bytes = file.file.read()
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="빈 파일은 업로드할 수 없습니다."
        )

    text = extract_text(file.filename or "guideline.txt", raw_bytes)
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="문서에서 텍스트를 추출하지 못했습니다. PDF가 스캔 이미지인 경우 텍스트 파일로 변환 후 다시 시도해 주세요.",
        )

    document = GuidelineDocument(title=title, source=source, version=version)
    db.add(document)
    db.flush()

    clause_count = ingest_document(db, document, text)
    if clause_count == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="문서에서 조항을 추출하지 못했습니다.",
        )

    db.refresh(document)
    return GuidelineUploadResponse(document=document, clause_count=clause_count)


@router.get("", response_model=list[GuidelineDocumentRead])
def list_guidelines(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.teacher, UserRole.student, UserRole.admin)
    ),
):
    return (
        db.query(GuidelineDocument).order_by(GuidelineDocument.uploaded_at.desc()).all()
    )
