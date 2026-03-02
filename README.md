<h1 align="center">
  <br>
  💊 Mediloon
  <br>
</h1>

<h4 align="center">AI-Driven Agentic Pharmacy System — Hackfusion 2026</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/LLM-Groq%20%7C%20OpenRouter-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<p align="center">
  An autonomous pharmacy ecosystem powered by a <strong>multi-agent AI</strong>. Customers order medications through natural <strong>voice or text</strong> conversation in English, German, Arabic, and Hindi. The system predicts refill needs, enforces prescription rules, and autonomously executes backend procurement — with minimal human intervention.
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Voice & Text Ordering** | Natural conversation with multi-turn context understanding |
| 🌍 **Multi-Language** | English, Deutsch, العربية, हिन्दी — auto-detected |
| 🤖 **Multi-Agent Architecture** | Ordering, Safety, Forecast & Procurement agents |
| 💊 **Safety Enforcement** | Prescription (RX) validation, no medical advice, Tier-1 alternatives only |
| 📈 **Predictive Refills** | Learns from order history, predicts depletion dates, auto-suggests refills |
| 🏭 **Warehouse Fulfillment** | Webhook-triggered fulfillment with auto-procurement on low stock |
| 📊 **Observability** | Full Langfuse tracing — every agent decision is logged and inspectable |
| 🛒 **Cart & Checkout** | Complete ordering flow with Cash on Delivery (COD) |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│         Frontend  (React + Vite)          │
│  Chat UI · Voice · Admin · Predictions   │
└─────────────────┬────────────────────────┘
                  │ REST API
┌─────────────────┴────────────────────────┐
│              FastAPI Backend              │
│                                          │
│  Ordering Agent ──► Safety Agent         │
│       │                                  │
│  Orchestrator ──► Forecast Agent         │
│       │                                  │
│  Tool Executor ──► Procurement Agent ──► Webhooks
│                                          │
│  SQLite · ChromaDB · Langfuse            │
└──────────────────────────────────────────┘
```

### 🤖 Agents

| Agent | Role |
|---|---|
| **Ordering Agent** | LLM-powered conversational agent. Understands intent, manages cart, handles multi-turn context |
| **Safety Agent** | Validates inputs, enforces prescription rules, blocks medical advice, checks drug safety |
| **Forecast Agent** | Predicts stock depletion using sales velocity analysis. Triggers proactive alerts |
| **Procurement Agent** | Auto-generates purchase orders, sends webhooks to suppliers, updates inventory |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| Database | SQLite |
| Vector Store | ChromaDB + sentence-transformers |
| LLM (Primary) | Groq — Llama 3.3 70B |
| LLM (Fallback) | OpenRouter — Gemma 3 27B |
| Voice | Web Speech API (STT / TTS) |
| Observability | Langfuse |

---

## 🚀 Quick Start

### Prerequisites
- Python **3.10+**
- Node.js **18+**
- API Keys (Groq, Langfuse)

### 1. Clone & Configure

```bash
git clone https://github.com/jadhavkrushna/mediloon.git
cd mediloon

cp .env.example .env
# Fill in your API keys in .env
```

**Required `.env` variables:**
```env
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

### 2. Start Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
> Backend runs at **http://localhost:8000**

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at **http://localhost:5173**

---

## � Project Structure

```
mediloon/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py       # Main pipeline
│   │   ├── ordering_agent.py     # LLM conversational agent
│   │   ├── safety_agent.py       # Input/output guardrails
│   │   ├── forecast_agent.py     # Stock depletion predictions
│   │   └── procurement_agent.py  # Auto-procurement + webhooks
│   ├── routes/                   # FastAPI endpoints
│   ├── tools/                    # Cart, query, trace tools
│   ├── db/                       # SQLite database + seed data
│   ├── vector/                   # ChromaDB vector search
│   ├── observability/            # Langfuse client
│   └── main.py                   # Server entry point
├── frontend/
│   └── src/
│       ├── components/           # UI components
│       ├── hooks/                # useSpeech, useRefillPredictions
│       ├── i18n/                 # Language context + translations
│       └── pages/                # AdminDashboard
├── data/                         # Excel source files
├── .env.example                  # Environment variables template
└── README.md
```

---

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Main chat endpoint (text & voice) |
| `GET` | `/api/cart/{session_id}` | Get session cart |
| `GET` | `/api/forecast/low-stock` | Predicted stock-outs |
| `GET` | `/api/refill/predictions/{id}` | Customer refill predictions |
| `POST` | `/api/procurement/generate` | Auto-generate purchase order |
| `GET` | `/api/admin/medications` | List all medications |

---

## 🛡️ Safety Rules

- ✅ Prescription (RX) enforcement from source data
- ✅ No medical advice, diagnoses, or dosage recommendations
- ✅ No antibiotic suggestions
- ✅ Tier-1 alternatives only (same active ingredient)
- ✅ All medications sourced from database only — no hallucination
- ✅ Input & output guardrails on every agent turn

---

## � Observability

Every agent turn is traced via **Langfuse**:

- **Safety Check** → Input validation result
- **Ordering Agent** → LLM reasoning, action chosen, model used
- **Tool Execution** → Search results, cart operations
- **Output Guard** → Final safety check

Access live traces at [cloud.langfuse.com](https://cloud.langfuse.com)

---

## 👨‍💻 Author

**Krushna Jadhav**  
[GitHub](https://github.com/jadhavkrushna)

---

## 📄 License

MIT — Hackfusion 2026
