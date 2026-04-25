"""Cached lookup of Census-derived area features for a ZIP code.

Wraps zipcode.get_zipcode_data and:
  - Reads CENSUS_API_KEY from .env or the environment.
  - Persists responses to .zip_cache.json so repeated runs don't hit the API.
  - Degrades to None on any failure so the engine keeps running with missing data.

Returned shape (or None):
  {
    "area_vacancy_safety": float,   # 1 - vacancy_rate; 1.0 = no vacancy
    "area_stability":      float,   # Sibhi's stability composite; 1.0 = best
    "area_income_level":   float,   # log-scaled median income; 1.0 = high income
  }
"""
from __future__ import annotations

import json
from pathlib import Path

from zipcode import get_zipcode_data, load_env_var


_CACHE_PATH = Path(__file__).parent / ".zip_cache.json"


def _load_cache() -> dict:
    if _CACHE_PATH.exists():
        try:
            return json.loads(_CACHE_PATH.read_text())
        except Exception:
            return {}
    return {}


def _save_cache(cache: dict) -> None:
    _CACHE_PATH.write_text(json.dumps(cache, indent=2))


def get_area_features(zip_code) -> dict | None:
    if not zip_code:
        return None
    zip_str = str(zip_code)

    cache = _load_cache()
    if zip_str in cache:
        return cache[zip_str]

    api_key = load_env_var("CENSUS_API_KEY")
    if not api_key:
        return None

    try:
        data = get_zipcode_data(zip_str, api_key)
    except Exception:
        return None

    profile = (data or {}).get("area_profile") or {}
    if not isinstance(profile, dict) or "error" in profile or "normalized_features" not in profile:
        return None

    nf = profile["normalized_features"]
    vacancy = nf.get("vacancy_rate")
    stability = nf.get("stability")
    income = nf.get("income")
    if vacancy is None or stability is None or income is None:
        return None

    out = {
        "area_vacancy_safety": max(0.0, min(1.0, 1.0 - float(vacancy))),
        "area_stability":      max(0.0, min(1.0, float(stability))),
        "area_income_level":   max(0.0, min(1.0, float(income))),
    }
    cache[zip_str] = out
    _save_cache(cache)
    return out
