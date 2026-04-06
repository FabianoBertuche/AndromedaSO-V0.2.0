"""Language detection router for MVP12 i18n support."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/v1/language", tags=["language"])


LANG_TO_LOCALE: dict[str, str] = {
    "pt": "pt-BR",
    "en": "en-US",
    "es": "es-ES",
    "fr": "fr-FR",
    "de": "de-DE",
    "it": "it-IT",
    "ja": "ja-JP",
    "zh": "zh-CN",
    "ko": "ko-KR",
    "ru": "ru-RU",
}


class DetectRequest(BaseModel):
    text: str
    min_confidence: float = 0.8


class DetectResponse(BaseModel):
    lang_code: str
    locale: str
    confidence: float
    fallback: bool


@router.post("/detect", response_model=DetectResponse)
async def detect_language(req: DetectRequest) -> DetectResponse:
    """Detect language from text and map to locale.

    Args:
        req: Request with text and optional min_confidence (default 0.8)

    Returns:
        DetectResponse with lang_code, locale, confidence, and fallback flag
    """
    try:
        from langdetect import DetectorFactory, detect_langs

        DetectorFactory.seed = 42

        if not req.text or not req.text.strip():
            return DetectResponse(
                lang_code="en",
                locale="en-US",
                confidence=0.0,
                fallback=True,
            )

        langs = detect_langs(req.text)

        if not langs:
            return DetectResponse(
                lang_code="en",
                locale="en-US",
                confidence=0.0,
                fallback=True,
            )

        top = langs[0]

        if top.prob >= req.min_confidence:
            lang_code = str(top.lang)
            locale = LANG_TO_LOCALE.get(lang_code, "en-US")
            return DetectResponse(
                lang_code=lang_code,
                locale=locale,
                confidence=top.prob,
                fallback=False,
            )

        return DetectResponse(
            lang_code="en",
            locale="en-US",
            confidence=top.prob if top else 0.0,
            fallback=True,
        )

    except Exception:
        return DetectResponse(
            lang_code="en",
            locale="en-US",
            confidence=0.0,
            fallback=True,
        )


@router.get("/locales")
async def list_supported_locales() -> dict:
    """List all supported locales with their language codes.

    Returns:
        Dictionary with supported locales mapping
    """
    return {
        "locales": [
            {"code": "pt-BR", "lang": "pt", "name": "Português (Brasil)"},
            {"code": "en-US", "lang": "en", "name": "English (US)"},
            {"code": "es-ES", "lang": "es", "name": "Español"},
            {"code": "fr-FR", "lang": "fr", "name": "Français"},
            {"code": "de-DE", "lang": "de", "name": "Deutsch"},
            {"code": "it-IT", "lang": "it", "name": "Italiano"},
            {"code": "ja-JP", "lang": "ja", "name": "日本語"},
            {"code": "zh-CN", "lang": "zh", "name": "中文"},
            {"code": "ko-KR", "lang": "ko", "name": "한국어"},
            {"code": "ru-RU", "lang": "ru", "name": "Русский"},
        ],
        "default": "pt-BR",
        "fallback": "en-US",
    }