from app.core.config import settings
from app.services.rag.retriever import retrieve_relevant_clauses

TEACHER_CHECK_NOTICE = (
    "\n\n※ 이 답변은 참고용 자동 응답입니다. 정확한 판단은 학교 담당 교사에게 확인하세요."
)


def _extractive_answer(hits: list[dict]) -> str:
    if not hits:
        return "관련된 가이드라인 조항을 찾지 못했습니다. 학교 담당 교사에게 확인해 주세요."

    top = hits[0]
    clause_label = f"{top['document_title']} {top['clause_number'] or ''}".strip()
    return (
        f"{clause_label}에 따르면 다음과 같습니다:\n\n"
        f"“{top['content']}”" + TEACHER_CHECK_NOTICE
    )


def _llm_answer(question: str, hits: list[dict]) -> str | None:
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
    except ImportError:
        return None

    context = "\n\n".join(
        f"[{h['document_title']} {h['clause_number'] or ''}] {h['content']}"
        for h in hits
    )
    prompt = (
        "다음은 학교 AI 활용 가이드라인 조항입니다. 반드시 아래 조항 내용에 근거해서만 "
        "답변하고, 조항에서 답을 찾을 수 없으면 '확인 필요'라고 답하세요. "
        "답변에는 근거로 사용한 조항 번호를 반드시 언급하세요.\n\n"
        f"[가이드라인 조항]\n{context}\n\n[질문]\n{question}"
    )

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception:
        return None


def answer_question(question: str) -> dict:
    hits = retrieve_relevant_clauses(question)
    top_similarity = hits[0]["similarity"] if hits else 0.0
    needs_check = (not hits) or (top_similarity < settings.CONFIDENCE_THRESHOLD)

    answer = _llm_answer(question, hits) if hits else None
    if not answer:
        answer = _extractive_answer(hits)

    return {
        "answer": answer,
        "sources": hits,
        "confidence": top_similarity,
        "needs_teacher_check": needs_check,
    }
