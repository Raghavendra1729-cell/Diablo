# Comprehensive Projects Summary

This document contains an extensive summary of all GitHub repositories built by Linga Seetha Rama Raghavendra.



## Project: Web Automation Agent

# 🤖 Web Automation Agent

A Python terminal agent that opens a **real Chromium browser**, navigates to a webpage, and uses an **AI vision model** (Qwen2.5-VL-72B on HuggingFace) to autonomously fill out forms and complete web tasks — by looking at screenshots and deciding what to click or type.

> Think of it as a robot that can see your screen and use a mouse and keyboard, guided by a powerful AI.

---

## ✨ How It Works

Every step of the loop:

```
📸 Take Screenshot  →  🤖 Ask AI "What next?"  →  🖱️ Execute Action  →  🔁 Repeat
```

1. A screenshot of the browser is taken and compressed
2. The screenshot + task description are sent to **Qwen2.5-VL-72B** (a vision+language model) via HuggingFace's API
3. The AI responds with a tool call — e.g., `click_on_screen(x=640, y=385)` or `send_keys("hello@email.com")`
4. That action is executed in the real browser via Playwright
5. Repeat until the AI signals `DONE`

---

## 🚀 Quick Start

### 1. Clone and Set Up

```bash
git clone <your-repo-url>
cd "Web Automation Agent"

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 2. Configure Your API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your HuggingFace API token:

```
HF_API_TOKEN=hf_your_token_here
```

> Get your token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 3. Set Your Task

Edit `src/main.py` to define what you want the agent to do:

```python
TASK = "Fill out the contact form with name 'Alex' and email 'alex@email.com'"
START_URL = "https://example.com/contact"
```

### 4. Run It

```bash
python src/main.py
```

A Chromium browser window will appear and the agent will start working. Watch it go!

---

## 📁 Project Structure

```
Web Automation Agent/
├── src/
│   ├── main.py              # Entry point — define your task here
│   ├── agent/
│   │   ├── agent.py         # Core agent loop + HuggingFace client
│   │   └── prompt.py        # System prompt + tool JSON schemas
│   ├── tools/
│   │   ├── state.py         # Shared browser state singleton
│   │   ├── browser.py       # Open/close browser
│   │   ├── screenshot.py    # Capture + compress screenshots
│   │   ├── mouse.py         # Click and double-click
│   │   ├── keyboard.py      # Type text
│   │   └── scroll.py        # Scroll up/down
│   └── utils/
│       ├── config.py        # Load HF_API_TOKEN from .env
│       └── logger.py        # Colored timestamped logs
├── docs/
│   ├── ARCHITECTURE.md      # Deep-dive architecture + design decisions
│   ├── HOW_IT_WORKS.md      # Beginner-friendly explanation
│   └── TOOLS_REFERENCE.md   # Complete reference for all 7 tools
├── .env                     # Your secrets (never commit this!)
├── .env.example             # Template for .env
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

---

## ⚙️ Configuration

All configuration is via the `.env` file:

| Variable | Required | Description |
|----------|----------|-------------|
| `HF_API_TOKEN` | ✅ Yes | Your HuggingFace API token for model inference |

The token is used to authenticate requests to HuggingFace's OpenAI-compatible inference API.

---

## 🛠️ Available Tools

The AI can call 7 tools to control the browser:

| Tool | What It Does |
|------|-------------|
| `open_browser()` | Launch Chromium browser |
| `navigate_to_url(url)` | Go to a URL |
| `take_screenshot()` | Capture current browser state |
| `click_on_screen(x, y)` | Click at pixel coordinates |
| `double_click(x, y)` | Double-click at pixel coordinates |
| `send_keys(text)` | Type text at cursor position |
| `scroll(direction, amount)` | Scroll page up or down |

→ Full reference: [docs/TOOLS_REFERENCE.md](docs/TOOLS_REFERENCE.md)

---

## 📦 Requirements

- **Python 3.10+**
- **HuggingFace account** with API token (free tier works)

### Python Packages

```
playwright          # Browser control
openai              # SDK for HuggingFace's OpenAI-compatible API
Pillow              # Screenshot compression
python-dotenv       # .env file loading
```

Install all with:

```bash
pip install -r requirements.txt
playwright install chromium
```

---

## 🏗️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Browser control | [Playwright](https://playwright.dev/python/) | Automate real Chromium |
| AI model | [Qwen2.5-VL-72B-Instruct](https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct) | Vision + reasoning |
| AI API | [HuggingFace Inference API](https://huggingface.co/docs/api-inference/) | OpenAI-compatible hosting |
| API SDK | [openai](https://github.com/openai/openai-python) | Talk to HuggingFace API |
| Screenshot compression | [Pillow](https://pillow.readthedocs.io/) | Reduce image size ~94% |
| Config | [python-dotenv](https://github.com/theskumar/python-dotenv) | Load API keys from .env |

---



## 💡 Key Design Highlights

### Custom Agent Loop (Not SDK Runner)
The OpenAI Agents SDK only passes text between steps. Our agent needs fresh screenshots injected at every iteration, so we write our own `async` loop with full control over the message payload.

### Screenshot Compression
Full 1280×720 PNG ≈ 500KB ≈ 750K tokens. Compressed 640×360 JPEG at quality 60 ≈ 30KB ≈ 45K tokens. **~94% token savings per step.**

### HuggingFace as OpenAI API
HuggingFace exposes an OpenAI-compatible endpoint at `https://router.huggingface.co/v1`. We use the standard `openai` Python SDK, just pointing it at a different URL. The `:cheapest` model suffix auto-routes to the lowest-cost available provider.

### Self-Correcting Agent
Tools return error strings instead of raising exceptions. The AI sees errors in the next step and adjusts its approach automatically.

---




---

## Project: Sasta-Notebook-llm

# Sasta NotebookLM

Sasta NotebookLM is a lightweight, fully functional Retrieval-Augmented Generation (RAG) application inspired by Google NotebookLM. It enables users to upload documents (PDF, TXT) and interactively query their contents using an LLM that is strictly grounded in the document context.

## 🚀 Live Demo & Source Code
- **Live Project**: [Insert Live URL Here]
- **GitHub Repository**: [Insert GitHub URL Here]

## 🏗️ Architecture & RAG Pipeline

The application features a complete end-to-end RAG pipeline:
1. **Ingestion & Parsing:** Documents are uploaded via a React frontend to a FastAPI backend. Text is extracted using `PyPDFLoader` or `TextLoader`.
2. **Chunking Strategy:** `RecursiveCharacterTextSplitter` is employed with a `chunk_size` of 2000 characters and `chunk_overlap` of 400 characters. This maintains semantic continuity across paragraph boundaries while optimizing for the context window of the embedding model.
3. **Embedding:** Text chunks are vectorized using `GoogleGenerativeAIEmbeddings` (specifically `models/gemini-embedding-2`), generating 3072-dimensional vectors.
4. **Vector Storage:** Embeddings and metadata are indexed in **Qdrant** (local or cloud) for fast and scalable similarity search.
5. **Retrieval:** User queries are embedded and matched against the Qdrant index using Cosine Similarity to fetch the Top-K (default 10) relevant chunks asynchronously.
6. **Generation:** A HuggingFace-hosted LLM generates answers governed by a strict system prompt to ensure responses are derived **solely** from the retrieved context, preventing hallucination.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend:** Python, FastAPI, LangChain
- **Database (Vector):** Qdrant
- **LLM / Embeddings:** HuggingFace Serverless Inference / Google Gemini Embeddings

## ⚙️ Local Development Setup

### 1. Backend Setup

```bash
cd BackEnd
python3 -m venv .venv
source .venv/bin/activate  # (On Windows use .venv\Scripts\activate)
pip install -r requirements.txt
```

**Environment Variables (`BackEnd/.env`):**
```env
HF_KEY=your_huggingface_key
HF_MODEL=meta-llama/Meta-Llama-3-8B-Instruct # Or any preferred HF model
GOOGLE_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:5173
# QDRANT_URL= (Optional for Qdrant Cloud)
# QDRANT_API_KEY= (Optional for Qdrant Cloud)
```

**Run Backend:**
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
```

**Environment Variables (`Frontend/.env`):**
```env
VITE_BACKEND_URI=http://127.0.0.1:8000
```

**Run Frontend:**
```bash
npm run dev
```

## 🔍 Features & Capabilities

- **Multi-Format Support:** Seamlessly process `.pdf` and `.txt` files.
- **Strict Grounding:** The LLM is heavily prompted to refuse answering out-of-context questions (zero hallucination policy).
- **Asynchronous Processing:** Built on `asyncio` and `FastAPI` for non-blocking document ingestion and concurrent similarity search.
- **Batch Vector Operations:** Chunk embeddings are batched and rate-limited to gracefully handle free-tier API quotas.
- **Modern UI:** Features a sleek interface supporting drag-and-drop, raw text paste, and a conversational layout.



---

## Project: Persona AI

# Persona AI Chatbot

This repository contains my submission for the persona-based AI chatbot assignment. The app lets a user chat with three different mentor personas: Anshuman Singh, Abhimanyu Saxena, and Kshitij Mishra. Each persona has a separate system prompt, separate suggestion chips, and a separate conversation flow, so switching between them feels like changing mentors rather than just changing a label.

The project is split into two folders:

- `persona ai backend` contains the FastAPI backend and the `/api/chat` route
- `persona ai frontend` contains the React + Vite + Tailwind frontend

## Features

- three persona images at the top of the page
- active persona highlight
- chat reset when the persona changes
- suggestion chips for each persona
- typing indicator while the response is loading
- user-friendly error handling
- mobile and desktop responsive layout

## Local setup

### Backend

```bash
cd "persona ai backend"
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend environment variables are documented in `persona ai backend/.env.example`.

### Frontend

```bash
cd "persona ai frontend"
npm install
cp .env.example .env
npm run dev
```

## Deployment

Deployed frontend URL: https://persona-ai-alpha-roan.vercel.app/  
Deployed backend URL: https://persona-ai-k8fx.onrender.com/

## Screenshots


<img width="1693" height="955" alt="Screenshot 2026-04-30 at 12 00 13 PM" src="https://github.com/user-attachments/assets/1cd5a798-db3f-4b70-b7be-69ed67aef2c1" />

<img width="1259" height="932" alt="Screenshot 2026-04-30 at 12 01 45 PM" src="https://github.com/user-attachments/assets/04cf5e92-dd67-4950-814f-154a48a62b44" />


<img width="1263" height="950" alt="Screenshot 2026-04-30 at 12 01 29 PM" src="https://github.com/user-attachments/assets/b0a93676-31c7-414d-8963-09e7056b38fe" />



---

## Project: Frontend

# Sasta LLM

A high-performance, grounded intelligence interface designed for deep focus and document synthesis.

## Features

- **Fixed-Viewport Layout**: No unintended scrolling, keeping all controls in place.
- **Neural Context Ingestion**: Ground your AI's answers in PDF and TXT documents.
- **PRO v2.0 Aesthetics**: Modern dark theme with glassmorphism and smooth Framer Motion animations.
- **Real-time Synchronization**: Instant feedback on document indexing and chat responses.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```


---

## Project: pollyGLot

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


---

## Project: persona ai frontend

# Frontend

This folder contains the React frontend for the Persona AI chatbot.

## Environment

Create a `.env` file in this folder with:

```bash
VITE_API_URL=http://localhost:8000
```

## Commands

```bash
npm install
npm run dev
npm run build
```


---

## Project: assignment2

#  Mini Agent: Autonomous AI Web Developer CLI

AI Agent CLI Tool 

##  Overview

**Mini Agent** is a sophisticated **Conversational CLI Agent** that reasons and acts autonomously to solve complex tasks. Built to mirror the workflow of advanced AI coding assistants like Cursor or Windsurf, Mini Agent can clone full-scale websites—specifically **Scaler Academy**—by generating high-quality HTML, CSS, and JavaScript files through a multi-step reasoning loop.

### Goal
To provide a terminal-based interface where users can chat with Mini Agent—an agent that doesn't just talk, but **executes**. It fetches real-time website data, plans its implementation, and produces production-grade frontend code.


---

##  Architecture: The Reasoning Loop

Mini Agent operates on a strict **THINK -> TOOL -> OBSERVE -> OUTPUT** loop, ensuring high reliability and transparency.

1.  **THINK (Reasoning):** Mini Agent analyzes the user's intent and plans the next logical step.
2.  **TOOL (Action):** Mini Agent selects and executes a tool (e.g., fetching a URL, writing a file, or running a shell command).
3.  **OBSERVE (Validation):** Mini Agent receives feedback from the environment (tool output) and updates its state.
4.  **OUTPUT (Communication):** Once the task is complete or more information is needed, Mini Agent communicates with the user.


---

##  Key Features

-   **Natural Language Interface:** Chat freely with Mini Agent in the terminal.
-   **Autonomous Cloning:** Automatically generates `index.html`, `styles.css`, and `script.js` from a single URL.
-   **Real-time Web Fetching:** Uses `BeautifulSoup4` to extract site structure, copy, and brand assets.
-   **Advanced UI Generation:** Produces responsive layouts with hero sections, navbars, cards, and footers.
-   **Integrated Browser Control:** Automatically opens the final result in your default browser.
-   **Protocol Safety:** Enforces strict JSON communication for deterministic behavior.

---

##  Technology Stack

-   **Language:** Python 3.9+
-   **LLM Integration:** OpenAI-compatible API (Hugging Face Inference Endpoints)
- **Engine:** Llama-3.3-70B-Instruct (via Hugging Face)
-   **Libraries:** `requests`, `beautifulsoup4`, `python-dotenv`, `openai`

---

## Getting Started

### 1. Installation

Clone the repository and install the required dependencies:

```bash
pip install openai requests beautifulsoup4 python-dotenv
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
HUGGINGFACE_API_KEY=your_hf_token_here
MODEL_NAME=meta-llama/Llama-3.3-70B-Instruct
```

### 3. Running the Agent

Launch the CLI:

```bash
python agent.py
```

---

##  Usage Guide

### General Conversation
The agent can answer technical questions or explain concepts before starting a task.
> **User:** "What are the benefits of using Vanilla CSS over Tailwind?"

###  Website Cloning
To clone the Scaler website, simply provide the URL:
> **User:** "Clone https://www.scaler.com for me"

**The Agent will:**
1.   **Think:** Plan the folder structure and file creation order.
2.   **Tool:** Fetch the website data.
3.   **Tool:** Create the `scaler_clone` directory.
4.   **Tool:** Write the HTML structure (Header, Hero, Footer).
5.   **Tool:** Generate a comprehensive CSS file with modern styling.
6.   **Tool:** Add interactive JS (Mobile menu, scroll effects).
7.   **Tool:** Open the final page in your browser.

---

##  Project Structure

```text
├── agent.py            # Main entry point and Reasoning Engine
├── prompt_config.py     # System instructions and few-shot examples
├── tools.py            # Tool definitions (Fetch, Write, Shell)
├── scaler_clone/       # Generated output directory
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md           # Documentation
```

---


---

-   **GitHub Repo:** https://github.com/Raghavendra1729-cell/WebCloner
-   **Video Demo:** [Insert Your YouTube Link Here]

*Built with ❤️.*


---

