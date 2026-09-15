from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.consent import Consent
from app.models.guideline import GuidelineDocument, PolicyComplianceCheck
from app.models.usage_log import AiUsageLog, QuizAttempt
from app.models.user import User, UserRole
from app.schemas.admin import AdminStats

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    user_counts = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )
    policy_counts = dict(
        db.query(Assignment.ai_policy_level, func.count(Assignment.id))
        .group_by(Assignment.ai_policy_level)
        .all()
    )
    compliance_counts = dict(
        db.query(PolicyComplianceCheck.status, func.count(PolicyComplianceCheck.id))
        .group_by(PolicyComplianceCheck.status)
        .all()
    )

    total_assignments = db.query(func.count(Assignment.id)).scalar() or 0
    total_consents = db.query(func.count(Consent.id)).scalar() or 0
    total_guideline_documents = (
        db.query(func.count(GuidelineDocument.id)).scalar() or 0
    )
    total_pii_flags = (
        db.query(func.count(AiUsageLog.id))
        .filter(AiUsageLog.pii_detected.is_(True))
        .scalar()
        or 0
    )

    total_quiz_attempts = db.query(func.count(QuizAttempt.id)).scalar() or 0
    passed_quiz_attempts = (
        db.query(func.count(QuizAttempt.id))
        .filter(QuizAttempt.passed.is_(True))
        .scalar()
        or 0
    )

    return AdminStats(
        user_counts={role.value: count for role, count in user_counts.items()},
        policy_level_counts={
            level.value: count for level, count in policy_counts.items()
        },
        compliance_status_counts={
            status.value: count for status, count in compliance_counts.items()
        },
        total_assignments=total_assignments,
        total_consents=total_consents,
        total_guideline_documents=total_guideline_documents,
        total_pii_flags=total_pii_flags,
        total_quiz_attempts=total_quiz_attempts,
        quiz_pass_rate=(
            passed_quiz_attempts / total_quiz_attempts if total_quiz_attempts else 0.0
        ),
    )
