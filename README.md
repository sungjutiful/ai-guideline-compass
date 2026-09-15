# 학교 AI 활용 가이드라인 준수 플랫폼

교육부·시도교육청의 "수행평가 시 인공지능(AI) 활용 관리 방안"을 학교 현장에서
실제로 지킬 수 있도록 돕는 상시 참조형 웹 서비스입니다. 교사는 과제별 AI 활용
기준을 설정하고 상위 가이드라인과 자동 대조하며, 학생은 과제 시작 전 기준을
확인·동의하고, 누구나 가이드라인 챗봇에 근거 조항과 함께 질문할 수 있습니다.

## 현재 구현 범위 (전체 기능)

- 이메일/역할(교사·학생·관리자) 기반 회원가입·로그인 (JWT). 관리자 가입은
  초대 코드(`ADMIN_INVITE_CODE`)로 통제됩니다.
- 가이드라인 문서(PDF/텍스트) 업로드 → 조항 단위 분리 → 벡터 검색 인덱싱
- 가이드라인 챗봇: 질문에 근거 조항과 유사도를 함께 제시, 신뢰도가 낮으면
  "담당 교사 확인 필요"로 안내
- 교사의 과제별 AI 활용 기준(금지/제한적 허용/전면 허용) 설정 및 상위
  가이드라인과의 자동 대조(자가진단)
- 사전교육 체크리스트(AI 윤리·개인정보 미니 퀴즈, 80% 이상 통과 필요) —
  통과해야 학생이 과제에 동의할 수 있도록 게이팅
- 학생의 과제별 기준 확인 및 동의 절차, 동의 로그 저장
- AI 활용 과정 기록(질문/응답/직접 작성 구간)과 활용 비율·타임라인 시각화,
  전화번호·주민등록번호·이메일 등 개인정보 실시간 감지 경고 및 저장 시 자동 마스킹
- 로그인 시 색상 배너(빨강/노랑/초록)로 현재 과제 기준을 상시 표시하는 대시보드
- 관리자 대시보드: 사용자/과제/자가진단/개인정보 감지/사전교육 통과율 등 전체 현황 통계
- 경량 PWA(설치 매니페스트 + 오프라인 캐싱 서비스워커)

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
| `ai_usage_logs` | AI 질문/응답/직접 작성 구간 기록 (개인정보 감지 여부 포함) |
| `quiz_attempts` | 학생의 사전교육 퀴즈 응시 기록 (점수, 통과 여부) |

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

## 배포 (Render 무료 플랜)

저장소 루트의 `render.yaml`이 Postgres + 백엔드(Docker) + 프론트엔드(Docker)를
한 번에 구성하는 Render Blueprint입니다.

1. https://render.com 가입 (신용카드 없이 무료 플랜으로 가능)
2. Render 대시보드 → **New** → **Blueprint** → 이 GitHub 저장소
   (`sungjutiful/ai-guideline-compass`)를 연결하고 브랜치를 선택
3. Render가 `render.yaml`을 읽어 아래 3개 리소스를 보여줍니다. 그대로 **Apply**:
   - `ai-guideline-compass-db` (Postgres, 무료 플랜)
   - `ai-guideline-compass-backend` (FastAPI, Docker)
   - `ai-guideline-compass-frontend` (React 빌드, Nginx, Docker)
4. 배포 중 `ANTHROPIC_API_KEY` 입력을 요청하면, 챗봇이 자연어 답변을 생성하길
   원하면 키를 입력하고, 비워두면 조항 인용형 답변으로 자동 동작합니다.
5. 배포가 끝나면 백엔드/프론트엔드 각각의 실제 URL이 생성됩니다
   (`ai-guideline-compass-*.onrender.com`이 이미 사용 중이면 Render가 다른
   이름을 붙일 수 있습니다). 이 경우 두 서비스의 URL이 서로 정확히 일치하도록
   백엔드의 `CORS_ORIGINS`와 프론트엔드의 `VITE_API_BASE_URL` 환경변수를
   실제 URL로 수정한 뒤 **Manual Deploy**로 재배포하세요.
6. 첫 접속 후 회원가입으로 계정을 만들고, 교사 계정으로 가이드라인 문서를
   업로드하면 서비스를 바로 사용할 수 있습니다. 관리자 계정 가입에는 백엔드
   서비스의 `ADMIN_INVITE_CODE` 환경변수 값(자동 생성됨, Render 대시보드에서
   확인 가능)이 필요합니다.

**무료 플랜 제약사항 (알아두세요):**
- Postgres 무료 플랜은 **생성 후 30일이 지나면 자동 삭제**됩니다. 장기 운영
  시 유료 플랜으로 전환하거나 만료 전 백업/재생성이 필요합니다.
- 무료 웹 서비스는 일정 시간 요청이 없으면 슬립 상태가 되며, 첫 요청 시
  기동에 수십 초가 걸릴 수 있습니다.
- 가이드라인 벡터 임베딩은 컨테이너 로컬 디스크(`vector_store_data`)에
  저장되는데, 무료 플랜은 영구 디스크(Persistent Disk)를 지원하지 않아
  재배포/재시작 시 초기화됩니다. 이 경우 가이드라인 문서를 다시 업로드하면
  복구됩니다. 운영 환경에서 지속성이 필요하면 Starter 이상 플랜에서 디스크를
  추가하거나(`render.yaml`에 `disk` 블록 추가), Docker Compose로 자체 서버에
  배포하는 것을 권장합니다.

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

## 개인정보 감지 및 사전교육 게이팅

- `backend/app/services/pii_detector.py`가 전화번호/주민등록번호/이메일 패턴을
  정규식으로 탐지합니다. 완벽한 탐지는 아니므로 프론트엔드에서도 동일 패턴으로
  입력 중 실시간 경고를 보여주고, 최종 저장 시 백엔드가 다시 검사해 감지된
  부분을 마스킹 처리합니다.
- 학생은 사전교육 퀴즈(`/quiz`, 5문항 중 80% 이상)를 통과해야 과제 동의가
  가능합니다. 퀴즈 문항은 `backend/app/services/quiz.py`에 정의되어 있습니다.

## 관리자 계정

- 회원가입 시 역할을 "관리자"로 선택하면 `ADMIN_INVITE_CODE`(`.env`, 기본값
  `CHANGE_ME_ADMIN_CODE`)와 일치하는 코드를 입력해야 가입됩니다. 운영 배포 시
  반드시 무작위 값으로 변경하세요.
- 관리자는 `/admin`에서 사용자·과제·자가진단·개인정보 감지·사전교육 통과율
  통계를 확인할 수 있습니다.

## 테스트

프론트엔드는 `npm run build`(타입체크 포함)로 검증했고, 백엔드는 회원가입 →
로그인 → 가이드라인 업로드 → 챗봇 질의 → 과제 등록/자가진단 → 사전교육 퀴즈 →
학생 동의 → AI 활용 로그 기록(개인정보 마스킹 확인) → 대시보드/관리자 통계까지
전체 플로우를 curl 및 실제 브라우저(Playwright)로 검증했습니다.
