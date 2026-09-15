from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.consent import Consent
from app.models.usage_log import AiUsageLog, UsageEntryType
from app.models.user import User, UserRole
from app.schemas.usage_log import UsageLogCreate, UsageLogRead, UsageSummary
from app.services.pii_detector import PATTERN_LABEL, anonymize, detect_pii

router = APIRouter(prefix="/assignments", tags=["usage-logs"])


@router.post(
    "/{assignment_id}/usage-logs",
    response_model=UsageLogRead,
    status_code=status.HTTP_201_CREATED,
)
def create_usage_log(
    assignment_id: int,
    payload: UsageLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="과제를 찾을 수 없습니다."
        )

    consent = (
        db.query(Consent)
        .filter(
            Consent.assignment_id == assignment_id,
            Consent.student_id == current_user.id,
        )
        .first()
    )
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI 활용 기준에 먼저 동의해야 활용 내역을 기록할 수 있습니다.",
        )

    findings = detect_pii(payload.content)
    safe_content = anonymize(payload.content) if findings else payload.content

    log_entry = AiUsageLog(
        assignment_id=assignment_id,
        student_id=current_user.id,
        entry_type=payload.entry_type,
        content=safe_content,
        source_tool=payload.source_tool,
        pii_detected=bool(findings),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    warning_labels = sorted({PATTERN_LABEL[f["type"]] for f in findings})
    return UsageLogRead.model_validate(log_entry).model_copy(
        update={"pii_warnings": warning_labels}
    )


@router.get("/{assignment_id}/usage-logs", response_model=UsageSummary)
def list_usage_logs(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="과제를 찾을 수 없습니다."
        )

    query = db.query(AiUsageLog).filter(AiUsageLog.assignment_id == assignment_id)
    if current_user.role == UserRole.student:
        query = query.filter(AiUsageLog.student_id == current_user.id)
    elif (
        current_user.role == UserRole.teacher
        and assignment.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인이 등록한 과제만 조회할 수 있습니다.",
        )

    entries = query.order_by(AiUsageLog.created_at.asc()).all()
    total = len(entries)
    ai_entries = sum(1 for e in entries if e.entry_type != UsageEntryType.self_written)
    self_written_entries = total - ai_entries
    ratio = (ai_entries / total) if total > 0 else 0.0

    entries_out = [
        UsageLogRead(
            id=e.id,
            assignment_id=e.assignment_id,
            student_id=e.student_id,
            student_name=e.student.name if current_user.role != UserRole.student else None,
            entry_type=e.entry_type,
            content=e.content,
            source_tool=e.source_tool,
            pii_detected=e.pii_detected,
            created_at=e.created_at,
        )
        for e in entries
    ]

    return UsageSummary(
        total_entries=total,
        ai_entries=ai_entries,
        self_written_entries=self_written_entries,
        ai_usage_ratio=ratio,
        entries=entries_out,
    )
