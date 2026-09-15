import re

# 완벽한 개인정보 탐지는 불가능하므로, 학생이 AI 도구에 흔히 실수로 입력하는
# 대표 패턴(전화번호/주민등록번호/이메일)만 우선 탐지합니다. 오탐/누락 가능성이
# 있으므로 최종 확인은 학생 스스로와 담당 교사에게 안내합니다.
PATTERNS: dict[str, re.Pattern] = {
    "phone": re.compile(r"01[016789]-?\d{3,4}-?\d{4}"),
    "rrn": re.compile(r"\d{6}-?[1-4]\d{6}"),
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
}

PATTERN_LABEL = {
    "phone": "전화번호",
    "rrn": "주민등록번호",
    "email": "이메일",
}


def detect_pii(text: str) -> list[dict]:
    """텍스트에서 개인정보로 의심되는 패턴을 찾아 반환합니다."""
    findings = []
    for pii_type, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            findings.append(
                {
                    "type": pii_type,
                    "label": PATTERN_LABEL[pii_type],
                    "matched_text": match.group(0),
                }
            )
    return findings


def anonymize(text: str) -> str:
    """탐지된 개인정보를 마스킹 처리해 저장용 텍스트를 만듭니다."""
    masked = text
    for pattern in PATTERNS.values():
        masked = pattern.sub(lambda m: _mask(m.group(0)), masked)
    return masked


def _mask(value: str) -> str:
    if len(value) <= 4:
        return "*" * len(value)
    return value[:2] + "*" * (len(value) - 4) + value[-2:]
