# app.py
import os
from dotenv import load_dotenv
load_dotenv()

import json
import logging
import re
import html
import mimetypes
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, HttpUrl
import uvicorn
import requests

# google api core exceptions for nicer error handling
from google.api_core import exceptions as gexc
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LLM Content Validator (Gemini)")

# ✅ Add this right below
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend origin: ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# import the genai SDK
try:
    import google.generativeai as genai
    _HAS_GENAI = True
except Exception:
    genai = None
    _HAS_GENAI = False

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("llm-service")

# --- Configuration from ENV ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
PORT = int(os.environ.get("PORT", 9000))
HOST = os.environ.get("HOST", "0.0.0.0")

# Load predefined tags from tags.json (file in same directory)
DEFAULT_TAGS = [
    "Wifi","Network","Cleanliness","Plumbing","Electrical","Lighting",
    "Safety","Security","Maintenance","Sanitation","Structural",
    "Accessibility","HVAC","Pest Control","Gardening","Transport",
    "Signage","Fire Safety","Other"
]

TAG_FILE = os.path.join(os.path.dirname(__file__), "tags.json")
PREDEFINED_TAGS: List[str] = DEFAULT_TAGS.copy()
try:
    if os.path.exists(TAG_FILE):
        with open(TAG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict) and "tags" in data and isinstance(data["tags"], list):
                PREDEFINED_TAGS = [str(t) for t in data["tags"]]
                log.info("Loaded %d tags from tags.json", len(PREDEFINED_TAGS))
            elif isinstance(data, list):
                PREDEFINED_TAGS = [str(t) for t in data]
                log.info("Loaded %d tags from tags.json (array format)", len(PREDEFINED_TAGS))
            else:
                log.warning("tags.json found but has unexpected format; using default tags")
    else:
        log.warning("tags.json not found, using default tags")
except Exception as e:
    log.exception("Failed to load tags.json; using default tags: %s", e)
    PREDEFINED_TAGS = DEFAULT_TAGS.copy()

# Configure Gemini client if SDK available and key present
GENAI_CONFIGURED = False
if GEMINI_API_KEY and _HAS_GENAI:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        GENAI_CONFIGURED = True
        log.info("Gemini client configured via google-generativeai SDK.")
    except Exception as e:
        log.exception("Failed to configure Gemini client at startup: %s", e)
else:
    if not GEMINI_API_KEY:
        log.warning("GEMINI_API_KEY not set. Validation endpoint will return error until configured.")
    if not _HAS_GENAI:
        log.warning("google.generativeai SDK not available. Install 'google-generativeai' to enable LLM checks.")



# --- schemas
class CheckRequest(BaseModel):
    description: str
    imageUrl: Optional[HttpUrl] = None
    # optional; service will fallback to PREDEFINED_TAGS
    allowedTags: Optional[List[str]] = None

class CheckResponse(BaseModel):
    allowed: bool
    reason: Optional[str] = None
    flags: dict
    suggestedTags: List[str]
    raw_llm: Optional[dict] = None

# --- helpers
def build_prompt(description: str, image_url: Optional[str], allowed_tags: List[str]) -> str:
    """
    Return system+user combined prompt instructing model to return strict JSON only.
    """
    tag_list_text = ", ".join(allowed_tags) if allowed_tags else "no tags provided"

    system = (
        "You are a strict content-moderation-and-categorization assistant. "
        "When given an image (accessible via the provided URL) and a text description, you MUST return "
        "ONLY a single JSON object (no surrounding commentary, no markdown, nothing but JSON). "
        "The JSON must match EXACTLY this schema:\n"
        '{\n'
        '  "allowed": boolean,          # true if content is allowed to post\n'
        '  "reason": string|null,       # short reason when blocked\n'
        '  "flags": {                   # booleans for categories\n'
        '      "inappropriate": boolean,\n'
        '      "spam": boolean,\n'
        '      "advertisement": boolean,\n'
        '      "mismatch": boolean\n'
        '  },\n'
        '  "suggestedTags": [string...]  # list of tags from the allowed tags list\n'
        '}\n\n'
        "Rules:\n"
        "1) If any of inappropriate/spam/advertisement is true, set allowed=false and provide reason.\n"
        "2) If mismatch is true (image clearly does not match the description), set allowed=false and provide reason.\n"
        "3) suggestedTags MUST be a subset of the allowed tags provided below; DO NOT invent new tags.\n"
        "4) If uncertain, set allowed=false and reason='uncertain'.\n"
        "Return JSON only and nothing else."
    )

    user = f"IMAGE_URL: {image_url or 'NONE'}\n\nDESCRIPTION: \"\"\"{description}\"\"\"\n\nALLOWED_TAGS: {tag_list_text}\n\nReturn the JSON object exactly as described above."

    return f"{system}\n\n{user}"

def extract_text_from_response(response: Any) -> str:
    """
    Safely extract a textual payload from various SDK response shapes.
    Avoid using response.text accessor directly because it may raise.
    Return a string (may be long) which should include the JSON object.
    """
    # 1) candidates
    try:
        cands = getattr(response, "candidates", None)
        if cands and isinstance(cands, (list, tuple)) and len(cands) > 0:
            cand0 = cands[0]
            # candidate may be object or dict
            txt = getattr(cand0, "text", None) or (cand0.get("text") if isinstance(cand0, dict) else None)
            if txt:
                return txt
    except Exception:
        pass

    # 2) outputs -> content
    try:
        outputs = getattr(response, "outputs", None)
        if outputs and isinstance(outputs, (list, tuple)) and len(outputs) > 0:
            out0 = outputs[0]
            content = getattr(out0, "content", None) or (out0.get("content") if isinstance(out0, dict) else None)
            if isinstance(content, (list, tuple)) and content:
                # search for first text-like entry
                for part in content:
                    if isinstance(part, dict):
                        for key in ("text", "plain_text", "content"):
                            if key in part and isinstance(part[key], str) and part[key].strip():
                                return part[key]
                    else:
                        txt = getattr(part, "text", None) or getattr(part, "plain_text", None)
                        if txt and isinstance(txt, str) and txt.strip():
                            return txt
            # fall back to stringifying the output element
            return str(out0)
    except Exception:
        pass

    # 3) response.response or response.output
    try:
        maybe = getattr(response, "response", None) or getattr(response, "output", None)
        if maybe:
            s = str(maybe)
            if s and len(s) > 0:
                return s
    except Exception:
        pass

    # 4) as last resort, stringify the whole response
    return str(response)

def clean_model_text_and_extract_json(text: str) -> Dict[str, Any]:
    """
    Given raw model text (may include triple-backticks, escaped JSON, or other wrappers),
    try to extract a JSON object and return it as dict.

    Raises ValueError if extraction/parsing fails.
    """
    if not text or not isinstance(text, str):
        raise ValueError("Empty or non-string model output")

    s = text.strip()

    # 1) extract fenced code block content if present
    fence_re = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", s, re.IGNORECASE)
    if fence_re:
        s = fence_re.group(1).strip()

    # 2) some model outputs contain escaped JSON e.g. "\"{\\n  \\\"a\\\":1\\n}\""
    # Try to unescape common escape sequences if they appear to exist.
    try:
        if r'\"' in s or r'\\n' in s or r'\\\"' in s:
            s_unescaped = s.encode('utf-8').decode('unicode_escape')
            # Trim surrounding quotes if present
            if s_unescaped.startswith('"') and s_unescaped.endswith('"'):
                s_unescaped = s_unescaped[1:-1]
            s = s_unescaped
    except Exception:
        # If unescape fails, keep original s
        pass

    # 3) Try direct json.loads
    try:
        return json.loads(s)
    except Exception:
        pass

    # 4) Extract first { ... } block and try again
    m = re.search(r"(\{(?:[\s\S]*?)\})", s)
    if m:
        candidate = m.group(1)
        candidate_clean = candidate
        try:
            candidate_clean = candidate.encode('utf-8').decode('unicode_escape')
        except Exception:
            pass
        try:
            return json.loads(candidate_clean)
        except Exception:
            # try HTML unescape
            try:
                return json.loads(html.unescape(candidate_clean))
            except Exception as e:
                raise ValueError(f"Failed to parse JSON candidate: {e}")

    raise ValueError("Unable to extract JSON object from model output")

def guess_mime_from_url(url: str) -> str:
    if not url:
        return "image/jpeg"
    mime, _ = mimetypes.guess_type(url)
    if mime and mime.startswith("image/"):
        return mime
    return "image/jpeg"

# --- routes
@app.get("/health")
def health():
    return {
        "ok": True,
        "genai_configured": GENAI_CONFIGURED,
        "has_genai_sdk": _HAS_GENAI,
        "port": PORT,
        "tag_count": len(PREDEFINED_TAGS)
    }

@app.get("/tags")
def get_tags():
    return {"tags": PREDEFINED_TAGS, "count": len(PREDEFINED_TAGS)}

@app.post("/validate", response_model=CheckResponse)
async def validate(req: CheckRequest):
    """
    Validate description + image and return structured JSON:
    { allowed, reason, flags, suggestedTags }
    """
    if not GENAI_CONFIGURED:
        log.error("LLM check attempted but Gemini not configured or SDK missing.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="LLM backend not configured. Set GEMINI_API_KEY and install google-generativeai.")

    # Normalize allowed tags (server canonical)
    allowed_tags: List[str] = [t for t in (req.allowedTags or PREDEFINED_TAGS) if t in PREDEFINED_TAGS]
    if not allowed_tags:
        allowed_tags = PREDEFINED_TAGS

    # Build prompt (strict JSON-only)
    prompt = build_prompt(req.description or "", str(req.imageUrl) if req.imageUrl else None, allowed_tags)

    # Build parts array (image bytes + text)
    parts = []
    if req.imageUrl:
        # fetch image bytes
        try:
            r = requests.get(str(req.imageUrl), timeout=15)
            r.raise_for_status()
            img_bytes = r.content
            mime = guess_mime_from_url(str(req.imageUrl))
        except Exception as e:
            log.exception("Failed to fetch image bytes: %s", e)
            raise HTTPException(status_code=400, detail="Could not fetch image for validation")

        # Try to create a Part from SDK types if available
        part_obj = None
        try:
            types_mod = getattr(genai, "types", None)
            if types_mod and hasattr(types_mod, "Part") and hasattr(types_mod.Part, "from_bytes"):
                part_obj = types_mod.Part.from_bytes(data=img_bytes, mime_type=mime)
            else:
                try:
                    from google.generativeai import types as genai_types  # type: ignore
                    if hasattr(genai_types, "Part") and hasattr(genai_types.Part, "from_bytes"):
                        part_obj = genai_types.Part.from_bytes(data=img_bytes, mime_type=mime)
                except Exception:
                    part_obj = None
        except Exception:
            part_obj = None

        if part_obj is not None:
            parts.append(part_obj)
        else:
            # fallback to dict with raw bytes (some SDK versions accept this)
            parts.append({"mime_type": mime, "data": img_bytes})

    # Add textual prompt as a text part
    parts.append({"text": prompt})

    try:
        # Ensure model object present
        if not hasattr(genai, "GenerativeModel"):
            raise RuntimeError("google-generativeai SDK does not expose GenerativeModel. Upgrade package.")

        model = genai.GenerativeModel(GEMINI_MODEL)

        # Call generate_content with stable params
        try:
            resp = model.generate_content(parts, generation_config={"temperature": 0.0, "max_output_tokens": 1024})
        except TypeError:
            # alternative signature fallback
            resp = model.generate_content(parts, temperature=0.0, max_output_tokens=1024)

        # Extract text safely (do NOT use resp.text accessor directly)
        text_out = extract_text_from_response(resp)

        # Clean & parse JSON using robust extractor
        try:
            parsed_json = clean_model_text_and_extract_json(text_out)
        except Exception as e:
            log.exception("Failed to extract JSON from model output: %s", e)
            raise HTTPException(status_code=500, detail=f"LLM returned non-JSON output. Raw (truncated): {str(text_out)[:1000]}")

        # Validate parsed_json conforms to expected keys and types
        if not isinstance(parsed_json, dict):
            raise HTTPException(status_code=500, detail="LLM returned JSON that is not an object")

        # required shape: allowed (bool), flags (dict), suggestedTags (list)
        allowed_val = bool(parsed_json.get("allowed", False))
        reason_val = parsed_json.get("reason", None)
        flags_val = parsed_json.get("flags", {})
        suggested_raw = parsed_json.get("suggestedTags", [])
        if not isinstance(flags_val, dict):
            flags_val = {}
        if not isinstance(suggested_raw, list):
            suggested_raw = []

        # enforce suggested tags to be subset of allowed_tags
        suggested_tags = [t for t in suggested_raw if isinstance(t, str) and t in allowed_tags]

        # sanitize flags
        flags = {
            "inappropriate": bool(flags_val.get("inappropriate", False)),
            "spam": bool(flags_val.get("spam", False)),
            "advertisement": bool(flags_val.get("advertisement", False)),
            "mismatch": bool(flags_val.get("mismatch", False))
        }

        return {
            "allowed": allowed_val,
            "reason": reason_val,
            "flags": flags,
            "suggestedTags": suggested_tags,
            "raw_llm": {"raw": str(text_out)[:4000]}
        }

    except gexc.GoogleAPIError as api_err:
        log.exception("Gemini API error: %s", api_err)
        raise HTTPException(status_code=500, detail=f"Gemini API error: {api_err.message}")
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("LLM call / parse failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"LLM check failed: {str(exc)}")


if __name__ == "__main__":
    if not GEMINI_API_KEY:
        log.warning("GEMINI_API_KEY not set in environment when starting app directly.")
    log.info("Starting uvicorn server on %s:%s (GENAI configured=%s) — tags loaded: %d",
             HOST, PORT, GENAI_CONFIGURED, len(PREDEFINED_TAGS))
    uvicorn.run("app:app", host=HOST, port=PORT, reload=True)
