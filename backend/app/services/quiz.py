QUIZ_QUESTIONS: list[dict] = [
    {
        "id": 1,
        "question": "AI가 작성한 글을 그대로 제출해도 항상 괜찮다.",
        "answer": False,
    },
    {
        "id": 2,
        "question": "AI 도구에 내 이름, 전화번호 등 개인정보를 입력하면 안 된다.",
        "answer": True,
    },
    {
        "id": 3,
        "question": "과제에서 AI를 활용했다면 활용 내역(질문/출처)을 기록해야 한다.",
        "answer": True,
    },
    {
        "id": 4,
        "question": "교사가 명시한 허용 범위를 벗어나 AI를 사용해도 문제되지 않는다.",
        "answer": False,
    },
    {
        "id": 5,
        "question": "AI의 답변은 사실과 다를 수 있으므로 반드시 검증해야 한다.",
        "answer": True,
    },
]

PASS_THRESHOLD_RATIO = 0.8  # 80% 이상 정답 시 통과


def get_public_questions() -> list[dict]:
    return [{"id": q["id"], "question": q["question"]} for q in QUIZ_QUESTIONS]


def grade(answers: dict[int, bool]) -> tuple[int, int, dict[int, bool]]:
    correct_answers = {q["id"]: q["answer"] for q in QUIZ_QUESTIONS}
    total = len(QUIZ_QUESTIONS)
    score = sum(
        1 for qid, correct in correct_answers.items() if answers.get(qid) == correct
    )
    return score, total, correct_answers


def is_passing(score: int, total: int) -> bool:
    return total > 0 and (score / total) >= PASS_THRESHOLD_RATIO
