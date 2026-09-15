# 학교 AI 활용 가이드라인 준수 플랫폼

교육부·시도교육청의 "수행평가 시 인공지능(AI) 활용 관리 방안"을 학교 현장에서
실제로 지킬 수 있도록 돕는 상시 참조형 웹 서비스입니다. 교사는 과제별 AI 활용
기준을 설정하고 상위 가이드라인과 자동 대조하며, 학생은 과제 시작 전 기준을
확인·동의하고, 누구나 가이드라인 챗봇에 근거 조항과 함께 질문할 수 있습니다.

## 현재 구현 범위 (MVP)

- 이메일/역할(교사·학생) 기반 회원가입·로그인 (JWT)
- 가이드라인 문서(PDF/텍스트) 업로드 → 조항 단위 분리 → 벡터 검색 인덱싱
- 가이드라인 챗봇: 질문에 근거 조항과 유사도를 함께 제시, 신뢰도가 낮으면
  "담당 교사 확인 필요"로 안내
- 교사의 과제별 AI 활용 기준(금지/제한적 허용/전면 허용) 설정 및 상위
  가이드라인과의 자동 대조(자가진단)
- 학생의 과제별 기준 확인 및 동의 절차, 동의 로그 저장
- 로그인 시 색상 배너(빨강/노랑/초록)로 현재 과제 기준을 상시 표시하는 대시보드
- 경량 PWA(설치 매니페스트 + 오프라인 캐싱 서비스워커)

### 다음 단계 (미구현, 확장 예정)

- AI 활용 과정(프롬프트/출처) 기록 및 사용 비율·타임라인 시각화
- 개인정보 입력 실시간 감지 경고
- 사전교육 체크리스트/미니 퀴즈
- 교육청 관리자 롤 및 다학교 운영

## 폴더 구조

```
backend/    FastAPI + SQLAlchemy + Alembic, RAG 챗봇/자가진단 서비스
frontend/   React + TypeScript + Vite, 경량 PWA
docs/       가이드라인 원본 문서 보관용
```

각 디렉터리의 상세 구조는 코드 내 주석과 `backend/app`, `frontend/src` 하위
디렉터리를 참고하세요.

## 데이터 모델 요약

| 테이블 | 설명 |
|---|---|
| `users` | 교사/학생/관리자 계정 |
| `assignments` | 과제, AI 활용 기준(`ai_policy_level`), 상세 허용 범위 |
| `guideline_documents` / `guideline_clauses` | 업로드된 지침 문서와 조항 단위 분리본 |
| `policy_compliance_checks` | 과제 기준과 가이드라인 조항 자동 대조 결과 |
| `consents` | 학생의 과제별 기준 동의 로그 |
| `chat_messages` | 챗봇 질문/답변 로그 (근거 조항 id, 신뢰도 포함) |

## 로컬 개발 환경 실행

### 백엔드

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # 필요 시 값 수정 (기본값은 SQLite 사용)
uvicorn app.main:app --reload
```

- 기본적으로 SQLite(`app.db`)를 사용하며 서버 시작 시 테이블이 자동 생성됩니다.
- Postgres를 사용하려면 `.env`의 `DATABASE_URL`을 변경하고
  `PYTHONPATH=. alembic upgrade head`로 마이그레이션을 적용하세요.
- API 문서: http://localhost:8000/docs

### 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env   # 백엔드 주소가 다르면 VITE_API_BASE_URL 수정
npm run dev
```

http://localhost:5173 에서 확인할 수 있습니다.

### Docker Compose (Postgres 포함 전체 스택)

```bash
cp backend/.env.example backend/.env   # DATABASE_URL은 compose가 자동으로 덮어씀
docker compose up --build
```

- 백엔드: http://localhost:8000
- 프론트엔드: http://localhost:5173

## 가이드라인 챗봇 동작 방식 (RAG)

1. 교사/관리자가 지침 문서를 업로드하면 "제O조" 패턴 기준으로 조항을 분리합니다
   (패턴이 없으면 문단 단위로 분리).
2. 각 조항을 문자 n-gram 해싱 기반으로 임베딩하여 경량 벡터 스토어(numpy 코사인
   유사도, `backend/app/services/rag/vectorstore.py`)에 저장합니다. 별도 서버나
   모델 다운로드 없이 오프라인으로 동작합니다.
3. 질문이 들어오면 가장 유사한 조항을 검색해 근거로 제시합니다.
   `ANTHROPIC_API_KEY`를 설정하면 조항에 근거한 자연어 답변을 생성하고,
   설정하지 않으면 조항을 그대로 인용하는 방식으로 자동 대체됩니다.
4. 최상위 유사도가 임계값(`CONFIDENCE_THRESHOLD`, 기본 0.15)보다 낮으면
   "담당 교사에게 확인 필요"로 안내합니다.
5. 운영 규모가 커지면 `EMBEDDING_PROVIDER=sentence-transformer`로 전환해 더
   정교한 의미 기반 임베딩을 사용할 수 있습니다(추가 패키지 설치 필요).

과제 자가진단(`backend/app/services/policy_checker.py`)도 동일한 검색 로직을
사용하되, 키워드 매칭으로 1차 참고용 준수/위반 가능성을 판단합니다. 법적·행정적
최종 판단을 대체하지 않으며 모든 결과에 "담당자 확인 필요" 안내가 함께 표시됩니다.

## 테스트

프론트엔드는 `npm run build`(타입체크 포함)로 검증했고, 백엔드는 회원가입 →
로그인 → 가이드라인 업로드 → 챗봇 질의 → 과제 등록/자가진단 → 학생 동의 →
대시보드 배너 전체 플로우를 curl 및 실제 브라우저(Playwright)로 검증했습니다.
