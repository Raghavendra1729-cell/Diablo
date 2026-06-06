---
title: Diablo AI Agent
emoji: 🦀
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🦀 Diablo — AI Agent for Linga Seetha Rama Raghavendra

**Diablo** is an autonomous voice-and-chat AI persona representing **Linga Seetha Rama Raghavendra**, an AI Engineer based in Bengaluru. You can call it, chat with it, and book an interview — fully automated, zero human in the loop.

It answers technical questions about Linga's background, skills, and 24+ GitHub repositories using RAG over his real resume and source code. It checks his live Cal.com calendar and books confirmed meetings independently.

**Live at:** [raghav-1729-diablo-ai-agent.hf.space](https://raghav-1729-diablo-ai-agent.hf.space)

---

## What It Does

- **Voice Agent** — Call the phone number. Diablo introduces itself, answers questions, handles interruptions, checks availability, and books meetings via a 2-step confirmation flow. Built on Vapi + Llama 3.3 70B.
- **Chat Interface** — Visit the URL. Ask about Linga's education (BITS Pilani, Scaler), projects (ExpenseTracker, Saathi-App, Forge, 21 more), skills, and experience. Evidence-backed answers grounded in ingested resume and repo data.
- **Live Calendar Booking** — Real Cal.com integration. Diablo checks available slots, proposes times, collects name/email (with STT error correction), confirms, and books. Confirmation email sent automatically.
- **Guardrails** — Prompt injection, jailbreak, and off-topic detection via regex patterns. Stays on-message: discusses Linga's qualifications and scheduling only.

---

## Architecture

```
User (Phone) → Vapi.ai (STT/TTS) ──┐
                                     ├──→ FastAPI Backend ──→ Qdrant Vector DB (4.2k chunks)
User (Browser) → React Frontend ────┘         │                    │
                                               │                    ▼
                                          Llama 3.3 70B        BGE-Small Embeddings
                                          (via HF Router)      (self-hosted)
                                               │
                                               ▼
                                          Cal.com v2 API
                                          (live booking)
```

**Pipeline:** Guardrails → Query Rewriting → Hybrid Retrieval (dense + sparse) → Re-rank → LLM with tool dispatch → Response

---

## Latency

Measured from deployed HuggingFace Space (warm):

| Endpoint | Avg | Detail |
|---|---|---|
| Health | 1.0s | Backend ping |
| Voice greeting | **2.0s** | 1 LLM call, no tools |
| Voice availability | **3.8s** | 2 LLM calls (check + synthesize) |
| Voice booking + email | **4.2s** | Eager email normalization + 2 LLM calls |

Vapi uses streaming — first-token latency is lower. `meta-llama/Llama-3.3-70B-Instruct` handles rapid tool calls with < 1s latency per hop.

---

## Setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Add HF_TOKEN, CAL_API_KEY, QDRANT_URL
python ingest.py        # Index resume + repos into Qdrant
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd chat-ui
npm install && npm run dev
```

Requires: Python 3.10+, Node 18+, accounts on HuggingFace, Qdrant Cloud, Cal.com, Vapi.ai.

---

## Cost

| | Per Session / Call |
|---|---|
| Web Chat (10 turns) | **~$0.005** |
| Voice Call (5 min) | **~$0.27** |

Embeddings and vector DB on free tiers. LLM via HuggingFace Router pay-per-token.

---

## Project Structure

```
backend/src/
├── api/           routes, schemas
├── llm/           OpenAI client, output parser
├── prompts/       channel-specific system prompts (voice/web)
├── tools/         calendar (Cal.com v2), RAG search, tool dispatch
├── utils/         email normalizer, guardrails
├── retrieval/     hybrid dense+sparse retrieval
├── embeddings/    BGE-small, BM25
├── chunking/      recursive text splitter
├── ingestion/     resume + repo loader
└── vectordb/      Qdrant client
```

---

*Built for the Scaler AI Engineer Screening Assignment.*
