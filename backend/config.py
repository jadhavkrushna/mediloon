"""
Mediloon Backend Configuration
Loads environment variables and provides configuration constants.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables — check multiple locations:
# 1. Render secret files path (/etc/secrets/.env)
# 2. Local repo root (.env next to frontend/backend folders)
# 3. Backend folder itself
_render_secrets = Path("/etc/secrets/.env")
_repo_root_env  = Path(__file__).parent.parent / ".env"
_backend_env    = Path(__file__).parent / ".env"

for _env_path in [_render_secrets, _repo_root_env, _backend_env]:
    if _env_path.exists():
        load_dotenv(_env_path, override=True)
        break

# Base paths
BASE_DIR = Path(__file__).parent.parent
_root_data = BASE_DIR / "data"
_backend_data = Path(__file__).parent / "data"

if _root_data.exists() and (_root_data / "mediloon.db").exists():
    DATA_DIR = _root_data
elif _backend_data.exists():
    DATA_DIR = _backend_data
else:
    DATA_DIR = _root_data

DB_PATH = Path(os.getenv("DB_PATH", str(DATA_DIR / "mediloon.db")))
CHROMA_PATH = DATA_DIR / "chroma_db"

# ── Groq Configuration (PRIMARY — fast, generous free tier) ─────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
# Primary model on Groq: fast 70B
GROQ_PRIMARY_MODEL = os.getenv("GROQ_PRIMARY_MODEL", "llama-3.3-70b-versatile")
# Groq fallback: ultra-fast 8B
GROQ_FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant")

# ── OpenRouter Configuration (SECONDARY — fallback when Groq is down) ─
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Model Configuration — Unified LLM-first ordering agent
# OpenRouter models: only used if Groq is unavailable
NLU_MODEL = os.getenv("NLU_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
# Fallback models: tried in order if primary returns 429 / timeout
NLU_FALLBACK_MODELS = [
    m.strip() for m in os.getenv(
        "NLU_FALLBACK_MODELS",
        "openai/gpt-4o-mini"
    ).split(",") if m.strip()
]
# Legacy — kept for backward compat but no longer used separately
PLANNER_MODEL = os.getenv("PLANNER_MODEL", "openrouter/auto")

# Embedding Model (local)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Testing: force regex-only mode (skip LLM calls)
NLU_FORCE_REGEX = os.getenv("NLU_FORCE_REGEX", "").lower() in ("1", "true", "yes")

# Vector Search Config
VECTOR_TOP_K = 3
SIMILARITY_THRESHOLD = 0.5

# Langfuse Observability
LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY", "")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY", "")
LANGFUSE_HOST = os.getenv("LANGFUSE_HOST") or os.getenv("LANGFUSE_BASE_URL") or "https://cloud.langfuse.com"

# Server Config
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
_extra_cors = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Production Vercel deployment
    "https://mediloon-frontend.vercel.app",
] + _extra_cors

# Ordering limits (backend-enforced across voice/text/UI)
MAX_ORDER_TOTAL_UNITS = int(os.getenv("MAX_ORDER_TOTAL_UNITS", "30"))
MAX_ORDER_SUBTOTAL_EUR = float(os.getenv("MAX_ORDER_SUBTOTAL_EUR", "500"))
MAX_ORDER_LINE_QTY = int(os.getenv("MAX_ORDER_LINE_QTY", "10"))

# RX enforcement and bypass controls
RX_ENFORCEMENT_ENABLED = os.getenv("RX_ENFORCEMENT_ENABLED", "true").lower() in ("1", "true", "yes")
RX_BYPASS_ENABLED = os.getenv("RX_BYPASS_ENABLED", "false").lower() in ("1", "true", "yes")
RX_BYPASS_TOKEN = os.getenv("RX_BYPASS_TOKEN", "")
RX_BYPASS_PHRASE = os.getenv("RX_BYPASS_PHRASE", "override rx")
# Comma-separated keyword hints used only when database lacks explicit rx_required flag.
RX_REQUIRED_KEYWORDS = [
    k.strip().lower() for k in os.getenv(
        "RX_REQUIRED_KEYWORDS",
        "amoxicillin,azithromycin,ciprofloxacin,doxycycline,metformin,ramipril,atorvastatin,levothyroxine,goodra"
    ).split(",") if k.strip()
]
# SMTP Configuration (for Gmail)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", SMTP_USER)
