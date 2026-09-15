// 백엔드 app/services/pii_detector.py 의 패턴과 동일하게 유지합니다.
// 완벽한 탐지는 아니며, 학생이 입력 중 즉시 알아챌 수 있도록 돕는
// 1차적인 실시간 경고 용도입니다. 최종 저장 시에는 백엔드가 다시 검사/마스킹합니다.
const PATTERNS: { label: string; regex: RegExp }[] = [
  { label: "전화번호", regex: /01[016789]-?\d{3,4}-?\d{4}/ },
  { label: "주민등록번호", regex: /\d{6}-?[1-4]\d{6}/ },
  { label: "이메일", regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
];

export function detectPiiLabels(text: string): string[] {
  const labels: string[] = [];
  for (const p of PATTERNS) {
    if (p.regex.test(text)) labels.push(p.label);
  }
  return labels;
}
