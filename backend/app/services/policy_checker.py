from app.models.assignment import AiPolicyLevel, Assignment
from app.models.guideline import ComplianceStatus
from app.services.rag.retriever import retrieve_relevant_clauses

PROHIBIT_KEYWORDS = ["금지", "허용하지 않는다", "사용할 수 없다", "불허"]
LIMIT_KEYWORDS = ["제한적으로", "제한된 범위", "부분적으로 허용", "사전 승인"]
FULL_KEYWORDS = ["전면 허용", "자유롭게 활용", "제한 없이"]

LEVEL_KEYWORDS = {
    AiPolicyLevel.prohibited: PROHIBIT_KEYWORDS,
    AiPolicyLevel.limited: LIMIT_KEYWORDS,
    AiPolicyLevel.full: FULL_KEYWORDS,
}

DEFAULT_NOTE = (
    "상위 가이드라인과 자동 비교한 참고 결과이며, 최종 판단은 담당자 확인이 필요합니다."
)


def check_assignment_policy(assignment: Assignment) -> list[dict]:
    """교사가 설정한 AI 활용 기준을 상위 가이드라인 조항과 자동 대조합니다.

    키워드 매칭 기반의 1차 자가진단으로, 정확한 법적/행정적 해석을
    대체하지 않습니다. 결과는 항상 "확인 필요" 안내와 함께 제공됩니다.
    """
    query = (
        f"{assignment.subject} {assignment.title} AI 활용 {assignment.policy_detail or ''}"
    )
    hits = retrieve_relevant_clauses(query, top_k=3)

    if not hits:
        return [
            {
                "matched_clause_id": None,
                "similarity_score": 0.0,
                "status": ComplianceStatus.ambiguous,
                "note": "비교할 가이드라인 조항이 아직 없습니다. 가이드라인 문서를 먼저 업로드해 주세요.",
            }
        ]

    matched_keywords = LEVEL_KEYWORDS.get(assignment.ai_policy_level, [])
    conflicting_keywords = [
        kw
        for level, kws in LEVEL_KEYWORDS.items()
        if level != assignment.ai_policy_level
        for kw in kws
    ]

    results = []
    for hit in hits:
        content = hit["content"]
        status = ComplianceStatus.ambiguous
        note = DEFAULT_NOTE

        if any(kw in content for kw in matched_keywords):
            status = ComplianceStatus.compliant
        elif any(kw in content for kw in conflicting_keywords):
            status = ComplianceStatus.violation
            snippet = content[:60] + ("..." if len(content) > 60 else "")
            note = f"'{snippet}' 조항과 상충할 가능성이 있습니다. 담당자 확인이 필요합니다."

        results.append(
            {
                "matched_clause_id": hit["clause_id"],
                "similarity_score": hit["similarity"],
                "status": status,
                "note": note,
            }
        )

    return results
