from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.consent import Consent
from app.models.guideline import PolicyComplianceCheck
from app.models.user import User, UserRole
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentDetail,
    AssignmentRead,
    AssignmentUpdate,
)
from app.services.policy_checker import check_assignment_policy

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _run_and_store_compliance_check(db: Session, assignment: Assignment) -> None:
    db.query(PolicyComplianceCheck).filter(
        PolicyComplianceCheck.assignment_id == assignment.id
    ).delete()
    for result in check_assignment_policy(assignment):
        db.add(
            PolicyComplianceCheck(
                assignment_id=assignment.id,
                matched_clause_id=result["matched_clause_id"],
                status=result["status"],
                similarity_score=result["similarity_score"],
                note=result["note"],
            )
        )
    db.commit()


@router.post("", response_model=AssignmentDetail, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.teacher, UserRole.admin)),
):
    assignment = Assignment(teacher_id=current_user.id, **payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    _run_and_store_compliance_check(db, assignment)
    db.refresh(assignment)
    return assignment


@router.get("", response_model=list[AssignmentRead])
def list_assignments(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    query = db.query(Assignment)
    if current_user.role == UserRole.teacher:
        query = query.filter(Assignment.teacher_id == current_user.id)
    return query.order_by(Assignment.created_at.desc()).all()


@router.get("/{assignment_id}", response_model=AssignmentDetail)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="과제를 찾을 수 없습니다."
        )

    detail = AssignmentDetail.model_validate(assignment)
    if current_user.role == UserRole.student:
        consent = (
            db.query(Consent)
            .filter(
                Consent.assignment_id == assignment_id,
                Consent.student_id == current_user.id,
            )
            .first()
        )
        detail.student_has_consented = consent is not None
    return detail


@router.patch("/{assignment_id}", response_model=AssignmentDetail)
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.teacher, UserRole.admin)),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="과제를 찾을 수 없습니다."
        )
    if assignment.teacher_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인이 등록한 과제만 수정할 수 있습니다.",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)

    _run_and_store_compliance_check(db, assignment)
    db.refresh(assignment)
    return assignment
