# Memory & Resource Documentation

> Last Updated: 2026-03-01

This document covers memory consumption, resource allocation, and data-flow diagrams for the **Mediloon** project — broken down by layer (System, Backend API, Frontend, Web Speech).

---

## 1. System Minimum Requirements

| Component            | Minimum     | Recommended  | Notes                                         |
|----------------------|-------------|--------------|-----------------------------------------------|
| **RAM (Backend)**    | 128 MB      | 256 MB       | Python + FastAPI process with aiosqlite       |
| **RAM (Frontend)**   | 256 MB      | 512 MB       | Vite dev server + browser tab with React      |
| **RAM (Total Dev)**  | ~512 MB     | 1 GB         | Both services running simultaneously          |
| **RAM (Production)** | 128 MB      | 256 MB       | Backend only; frontend is static after build  |
| **Disk (Backend)**   | ~100 MB     | ~200 MB      | Python venv + SQLite DB + uploads folder      |
| **Disk (Frontend)**  | ~250 MB     | ~300 MB      | `node_modules` + compiled assets              |
| **CPU**              | 1 core      | 2 cores      | Async I/O; agents can be CPU-spiky briefly    |
| **OS**               | Windows/Linux/macOS | —  | No OS-specific dependencies                   |

---

## 2. Backend API Memory Profile

The backend is designed for a **minimal memory footprint (~50 MB active)**. Here is why:

### 2.1 Stack & Why It's Lean

| Library         | Version  | Memory Role                                              |
|-----------------|----------|----------------------------------------------------------|
| `fastapi`       | ≥0.109   | Async framework; no extra thread per request             |
| `uvicorn`       | ≥0.27    | ASGI server; single event loop                           |
| `aiosqlite`     | ≥0.19    | File-based async SQLite; no separate DB server process   |
| `PyJWT`         | ≥2.8     | Pure-Python JWT; negligible memory usage                 |
| `httpx`         | ≥0.26    | Async HTTP client; connection pool, shared                |
| `pinecone`      | ≥5.0     | **Cloud-based** vector store — no local embeddings       |
| `langfuse`      | ≥2.0     | Observability client; lightweight batch sender           |
| `python-dotenv` | ≥1.0     | Config only; loaded once at startup                      |

> **Key design decision**: Using **Pinecone** (cloud) instead of ChromaDB (local) avoids loading
> 3–4 GB of ML models (transformers, PyTorch) into RAM. The backend falls back to ChromaDB
> or SQL-only search if Pinecone credentials are missing (see `main.py` startup logic).

### 2.2 Startup Memory Flow

```
python main.py
   │
   ├── Import FastAPI app (~10 MB Python runtime)
   ├── init_db() → Open SQLite file (aiosqlite, ~1 MB)
   ├── seed_all() → Read/write seed data (~5 MB peak, then GC'd)
   ├── seed_suppliers() → Small DB write (~1 MB)
   └── init_pinecone() → HTTP connection to Pinecone cloud (0 MB local)
         └── index_medications() → Sends data to cloud, no local index kept
   
   Total resident memory at idle: ~50–80 MB
```

### 2.3 Per-Request Memory

| Route Group          | Endpoint Example              | ~Memory per Request |
|----------------------|-------------------------------|---------------------|
| Auth                 | `POST /api/auth/login`        | < 1 MB              |
| Catalog / Search     | `GET /api/catalog`            | < 2 MB              |
| Cart                 | `POST /api/cart`              | < 1 MB              |
| Agent (AI Chat)      | `POST /api/agents/message`    | 2–5 MB (HTTP call to LLM cloud) |
| Upload / OCR         | `POST /api/upload`            | 5–20 MB (image in memory during OCR) |
| Forecast             | `GET /api/forecast`           | 3–8 MB (in-process stats computation) |
| Procurement          | `POST /api/procurement`       | < 2 MB              |

> Memory from image uploads and forecast computations is released immediately after the request
> completes (Python's garbage collector handles it).

---

## 3. Frontend Memory Profile

The React frontend runs entirely in the **browser tab** and uses Vite as the dev/build tool.

### 3.1 Vite Dev Server (Development)

| Process             | Memory Usage     |
|---------------------|------------------|
| `vite` dev server   | ~80–120 MB (Node.js) |
| Browser tab (React) | ~100–250 MB       |
| **Total**           | ~180–370 MB       |

### 3.2 Production Build (After `npm run build`)

After running `vite build`, the output is a set of **static files** (HTML, CSS, JS). These are
served by a static file host or CDN — no Node.js process needed at runtime.

| Asset Type       | Size (approx.)    |
|------------------|-------------------|
| `index.html`     | ~2 KB             |
| JS bundle        | ~400–600 KB gzip  |
| `output.css`     | ~15 KB gzip       |
| **Browser RAM**  | ~80–150 MB        |

### 3.3 Key In-Memory State (React)

The following React state in `App.jsx` lives in browser memory for the lifetime of the session:

| State Variable       | Description                                      | Memory Impact |
|----------------------|--------------------------------------------------|---------------|
| `messages[]`         | Chat history (text strings)                      | Low           |
| `cart[]`             | Current shopping cart items                      | Very low      |
| `user`               | Authenticated user profile object                | Negligible    |
| `sessionToken`       | JWT string stored in `localStorage`              | Negligible    |
| `sessionId`          | Agent session string                             | Negligible    |
| `refills[]`          | Medication refill reminders                      | Low           |

---

## 4. Web Speech API Memory Flow

The Web Speech API (STT + TTS) is implemented in `frontend/src/hooks/useSpeech.js`. All
processing happens **inside the browser** using the OS's native speech engine — **no audio
data is ever sent to your backend**.

### 4.1 Key Browser Resources Allocated

| Resource                   | Lifecycle                              | Memory / CPU    |
|----------------------------|----------------------------------------|-----------------|
| `SpeechRecognition` object | Created **once** on mount via `useRef` | ~5–15 MB (OS)   |
| `AudioContext`             | Created on `startListening()`          | ~10–30 MB       |
| `AnalyserNode`             | Attached to `AudioContext`             | ~0.5 MB (FFT buffer: 256 bytes) |
| `MediaStream` (mic)        | Opened on `startListening()`           | ~5 MB (OS)      |
| `SpeechSynthesisUtterance` | Created per `speak()` call             | < 1 MB per call |

### 4.2 STT (Speech-to-Text) Memory Flow

```
User clicks microphone
        │
        ▼
startListening()
   ├── navigator.mediaDevices.getUserMedia({ audio: true })
   │      └── Allocates MediaStream → AudioContext → AnalyserNode
   │          (fftSize: 256 → buffer: 128 bytes of frequency data)
   │
   ├── recognitionRef.current.start()   ← Reuses the SAME instance (no re-creation)
   │      └── Browser streams audio to OS speech engine
   │
   └── requestAnimationFrame(updateLevel) loop
          └── Reads 128-byte Uint8Array every frame for audio visualizer
                └── Normalized to 0–1 float → setAudioLevel (UI waveform)

On speech result:
   ├── detectScript(text)    ← Checks first 50 chars against Unicode ranges (fast)
   ├── detectLanguageFromText() ← Regex hints (German, Hindi, Arabic, English)
   └── setTranscript() / setDetectedLanguage() → React re-render


stopListening() / onend
   ├── cancelAnimationFrame()   ← Stops the RAF loop
   ├── AudioContext.close()     ← Frees OS audio resources
   └── MediaStream tracks stopped
```

### 4.3 TTS (Text-to-Speech) Memory Flow

```
speak(text, options)
        │
        ├── SpeechSynthesisUtterance created (text → OS voice engine)
        │
        ├── Voice Selection Priority:
        │      1. selectedVoice (if lang matches)
        │      2. Exact lang match (e.g., 'hi-IN')
        │      3. Base lang prefix (e.g., 'hi-*')
        │      4. English fallback
        │      5. First available voice
        │
        ├── TTS Heartbeat (every 5s):
        │      synthRef.pause() → synthRef.resume()
        │      └── Prevents Chrome from freezing the speech queue
        │
        └── TTS Watchdog (30s timeout):
               synthRef.cancel() + handleEnd()
               └── Prevents voice loop from stalling forever

handleEnd()
   ├── setIsSpeaking(false)
   ├── clearTimeout(watchdog)
   ├── clearInterval(heartbeat)
   └── options.onEnd() callback → triggers next voice loop step
```

### 4.4 Language / Script Detection (No Memory Allocation)

Detection is done entirely with **pre-compiled regex patterns** on the first 50 characters of
text. No NLP libraries, no model weights, no network calls.

| Language    | Detection Method                        |
|-------------|-----------------------------------------|
| Hindi       | Unicode `\u0900–\u097F` (Devanagari)   |
| Tamil       | Unicode `\u0B80–\u0BFF`               |
| Arabic      | Unicode + Latin romanization hints      |
| German      | Keyword hints (und, ich, bitte, danke…) |
| English     | Keyword hints (the, please, need…)      |
| Hinglish    | Keyword hints (mujhe, chahiye, dawai…)  |

---

## 5. Database Memory

SQLite is a **file-based** database. It does not run as a separate process.

| Property                | Value                                    |
|-------------------------|------------------------------------------|
| File location           | `backend/db/mediloon.db` (or `pharmacy.db`) |
| Driver                  | `aiosqlite` (async SQLite)               |
| Connection pool         | Single connection, async queue           |
| In-memory cache (SQLite)| Default page cache: ~2 MB               |
| WAL mode                | Off (default) — simple for single-user dev |
| Data at rest            | Tables: customers, cart, orders, catalog, inventory, sessions, traces… |

---

## 6. External Services (Zero Local Memory)

These services are called via HTTPS. They consume **zero local RAM** beyond the request/response
JSON payload (~1–50 KB per call).

| Service        | Purpose                       | Called From        |
|----------------|-------------------------------|--------------------|
| **Pinecone**   | Semantic medicine search      | Backend startup + agent routes |
| **Groq / OpenRouter** | LLM (AI agent replies) | `agent_routes.py`  |
| **Firebase Auth** | User credential validation  | `firebaseClient.js` (frontend) |
| **Langfuse**   | Observability / tracing       | Backend + agent routes |
| **OCR (cloud)**| Prescription image reading    | `upload_routes.py`  |

---

## 7. Memory Optimization Notes

1. **Web Speech**: The `SpeechRecognition` instance is created once via `useRef` and **never
   re-created** when the language changes. This avoids repeated allocation/deallocation of the
   OS speech engine object.

2. **Audio Analysis**: The `AnalyserNode` uses `fftSize: 256` (smallest useful FFT size),
   producing a 128-element frequency buffer — a tiny 128-byte `Uint8Array`.

3. **TTS Watchdog**: The 30-second watchdog timer ensures no `SpeechSynthesisUtterance` ever
   gets "stuck" in the browser's internal queue, preventing memory from being held by a
   zombie utterance.

4. **Vector Store**: Using Pinecone (cloud) instead of ChromaDB avoids loading PyTorch
   (`~2 GB`) and transformer model weights (`~200 MB–2 GB`) into any local process.

5. **JWT Stateless Auth**: Sessions are stateless JWTs. No server-side session objects are
   stored in memory. The `user_sessions` DB table exists only for legacy compatibility.

6. **SQLite over PostgreSQL**: SQLite avoids the ~10–50 MB RAM tax of a PostgreSQL/MySQL
   server process for development. Suitable for up to ~100 concurrent users.
