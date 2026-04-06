"""Lightweight heuristics for the MVP05 task classification endpoint."""

from __future__ import annotations

import re

from contracts.classification import TaskClassification


def classify_query(query: str) -> TaskClassification:
    """Maps a free-form query into a stable, non-authoritative routing hint."""

    normalized = query.lower()

    if re.search(r"(debug|stack trace|erro|fix bug|corrigir)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="coding.debug",
            requiredCapabilities=["coding"],
            confidence=0.65,
            reasoning="Detected debugging intent in the request.",
        )

    if re.search(r"(arquitetura|architecture|refactor|design system)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="coding.architecture",
            requiredCapabilities=["coding"],
            confidence=0.62,
            reasoning="Detected architecture or refactor intent.",
        )

    if re.search(r"(traduz|translate|translation)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="translation",
            requiredCapabilities=["chat"],
            confidence=0.58,
            reasoning="Detected translation intent.",
        )

    if re.search(r"(resum|summary|summarize)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="chat.summarization",
            requiredCapabilities=["summarization"],
            confidence=0.63,
            reasoning="Detected summarization intent.",
        )

    if re.search(r"(rag|retrieval|embedding|vector)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="rag.retrieval",
            requiredCapabilities=["rag"],
            confidence=0.66,
            reasoning="Detected retrieval-augmented generation intent.",
        )

    if re.search(r"(imagem|image|vision|foto|screenshot)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="vision.general",
            requiredCapabilities=["vision"],
            confidence=0.60,
            reasoning="Detected vision-related intent.",
        )

    if re.search(r"(audio|speech|transcri|stt|tts)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="audio.stt",
            requiredCapabilities=["audio"],
            confidence=0.60,
            reasoning="Detected audio-related intent.",
        )

    if re.search(r"(código|code|function|typescript|python|javascript)", normalized, re.IGNORECASE):
        return TaskClassification(
            activityType="coding.generate",
            requiredCapabilities=["coding"],
            confidence=0.64,
            reasoning="Detected implementation intent.",
        )

    return TaskClassification(
        activityType="chat.general",
        requiredCapabilities=["chat"],
        confidence=0.55,
        reasoning="Default conversational fallback.",
    )
