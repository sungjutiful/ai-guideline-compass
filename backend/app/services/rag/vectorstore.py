import json
import os
from dataclasses import dataclass, field

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings


@dataclass
class _StoreState:
    ids: list[str] = field(default_factory=list)
    embeddings: np.ndarray | None = None
    documents: list[str] = field(default_factory=list)
    metadatas: list[dict] = field(default_factory=list)


class SimpleVectorStore:
    """numpy 코사인 유사도 기반의 경량 벡터 스토어.

    가이드라인 조항 수준(수십~수천 건)에서는 충분히 빠르고, 파일 하나로
    영속화되어 별도 서버가 필요 없습니다. upsert/query/count 인터페이스를
    유지한 채 Chroma나 FAISS 구현으로 교체할 수 있도록 설계했습니다.
    """

    def __init__(self, persist_dir: str, name: str):
        os.makedirs(persist_dir, exist_ok=True)
        self._path = os.path.join(persist_dir, f"{name}.json")
        self._state = self._load()

    def _load(self) -> _StoreState:
        if not os.path.exists(self._path):
            return _StoreState()
        with open(self._path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        embeddings = (
            np.array(raw["embeddings"], dtype=float) if raw["embeddings"] else None
        )
        return _StoreState(
            ids=raw["ids"],
            embeddings=embeddings,
            documents=raw["documents"],
            metadatas=raw["metadatas"],
        )

    def _save(self) -> None:
        with open(self._path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "ids": self._state.ids,
                    "embeddings": (
                        self._state.embeddings.tolist()
                        if self._state.embeddings is not None
                        else []
                    ),
                    "documents": self._state.documents,
                    "metadatas": self._state.metadatas,
                },
                f,
                ensure_ascii=False,
            )

    def count(self) -> int:
        return len(self._state.ids)

    def upsert(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: list[dict],
    ) -> None:
        new_embeddings = np.array(embeddings, dtype=float)
        existing_index = {id_: i for i, id_ in enumerate(self._state.ids)}

        for i, id_ in enumerate(ids):
            if id_ in existing_index:
                idx = existing_index[id_]
                self._state.documents[idx] = documents[i]
                self._state.metadatas[idx] = metadatas[i]
                if self._state.embeddings is not None:
                    self._state.embeddings[idx] = new_embeddings[i]
            else:
                self._state.ids.append(id_)
                self._state.documents.append(documents[i])
                self._state.metadatas.append(metadatas[i])
                if self._state.embeddings is None:
                    self._state.embeddings = new_embeddings[i : i + 1]
                else:
                    self._state.embeddings = np.vstack(
                        [self._state.embeddings, new_embeddings[i]]
                    )

        self._save()

    def query(self, query_embedding: list[float], n_results: int) -> list[dict]:
        if self.count() == 0:
            return []

        query_vec = np.array(query_embedding, dtype=float).reshape(1, -1)
        similarities = cosine_similarity(query_vec, self._state.embeddings)[0]
        top_indices = np.argsort(similarities)[::-1][:n_results]

        return [
            {
                "id": self._state.ids[i],
                "document": self._state.documents[i],
                "metadata": self._state.metadatas[i],
                "similarity": float(similarities[i]),
            }
            for i in top_indices
        ]


_collections: dict[str, SimpleVectorStore] = {}


def get_collection(name: str = "guideline_clauses") -> SimpleVectorStore:
    if name not in _collections:
        _collections[name] = SimpleVectorStore(settings.CHROMA_PERSIST_DIR, name)
    return _collections[name]
