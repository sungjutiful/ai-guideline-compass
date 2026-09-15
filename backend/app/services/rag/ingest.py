import re
from io import BytesIO

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.models.guideline import GuidelineClause, GuidelineDocument
from app.services.rag.embeddings import get_embedding_provider
from app.services.rag.vectorstore import get_collection

CLAUSE_PATTERN = re.compile(r"(제\s*\d+\s*조(?:의\s*\d+)?)")


def extract_text(filename: str, raw_bytes: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(BytesIO(raw_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return raw_bytes.decode("utf-8", errors="ignore")


def split_into_clauses(text: str) -> list[tuple[str | None, str]]:
    text = text.strip()
    if not text:
        return []

    matches = list(CLAUSE_PATTERN.finditer(text))
    if not matches:
        # 조항 표기(제O조)가 없으면 빈 줄 기준 문단 단위로 분할
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        return [(None, p) for p in paragraphs]

    clauses: list[tuple[str | None, str]] = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        clause_number = match.group(1).replace(" ", "")
        content = text[start:end].strip()
        if content:
            clauses.append((clause_number, content))
    return clauses


def ingest_document(db: Session, document: GuidelineDocument, raw_text: str) -> int:
    clause_tuples = split_into_clauses(raw_text)
    if not clause_tuples:
        return 0

    provider = get_embedding_provider()
    contents = [content for _, content in clause_tuples]
    embeddings = provider.embed_documents(contents)

    clause_rows: list[GuidelineClause] = []
    for clause_number, content in clause_tuples:
        clause = GuidelineClause(
            document_id=document.id,
            clause_number=clause_number,
            content=content,
        )
        db.add(clause)
        clause_rows.append(clause)
    db.flush()  # id 확보

    vector_ids = [f"clause-{clause.id}" for clause in clause_rows]
    for clause, vector_id in zip(clause_rows, vector_ids):
        clause.vector_id = vector_id

    collection = get_collection()
    collection.upsert(
        ids=vector_ids,
        embeddings=embeddings,
        documents=contents,
        metadatas=[
            {
                "clause_id": clause.id,
                "document_id": document.id,
                "document_title": document.title,
                "clause_number": clause.clause_number or "",
            }
            for clause in clause_rows
        ],
    )

    db.commit()
    return len(clause_rows)
