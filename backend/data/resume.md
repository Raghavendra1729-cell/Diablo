# Linga Seetha Rama Raghavendra
Bengaluru, Karnataka | lingaraghawendra@gmail.com | +91 9347935936
LinkedIn | GitHub | LeetCode | CodeChef | AtCoder

AI Engineer with deployed RAG pipelines, agentic Al systems, and scalable backend services used by real users. Solved 900+ LeetCode problems (max rating 1750, 365-day streak); ranked on Dean's List at Scaler with a 9.11 CGPA. Proficient across the full Al engineering stack LangChain, Qdrant, Gemini embeddings, vision-language models, FastAPI with a strong systems design foundation (LLD+ HLD). Seeking an AI Engineer internship.

## Technical Skills
* **Languages:** Python, Java, C++, TypeScript, JavaScript, SQL
* **Generative AI & ML:** RAG Pipelines, LangChain, Vector Databases (Qdrant), Embedding Models (Google Gemini), LLM APIs (Hugging Face, Gemini), Vision-Language Models, Prompt Engineering, Scikit-learn
* **Backend & Frameworks:** FastAPI, Spring Boot, Node.js, Express.js, React.js, Vite, Socket.IO, Tailwind CSS
* **Systems & CS Core:** Low-Level Design, High-Level Design, OOP, DSA, REST APIs, DBMS, Operating Systems, Computer Networks, Socket Programming, Multi-threading
* **DevTools:** Git, GitHub, Linux, Postman, Playwright, Docker, Vercel, Agentic Coding (Codex, Claude Code)

## Education

### Birla Institute of Technology and Science (BITS) Pilani
* **Location:** Pilani, Rajasthan
* **Degree:** Bachelor of Science, Computer Science
* **Duration:** Aug 2024 - Aug 2027
* **CGPA:** 9.0/10
* **Relevant Coursework:** Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Computer Networks, Discrete Mathematics, Linear Algebra

### Scaler School of Technology
* **Program:** Software Engineering UG Program
* **Location:** Bengaluru, Karnataka
* **Duration:** Aug 2024 - Aug 2028
* **CGPA:** 9.11/10 | Honors: Dean's List

## Work Experience

### Teaching Assistant Buddy
* **Company/Institution:** Scaler School of Technology
* **Duration:** Mar 2026 - Present
* Mentored 30+ students through advanced coursework in Data Structures, Algorithms, and Object-Oriented Programming, conducting weekly hands-on debugging and code review sessions.
* Produced reusable step-by-step templates and walkthroughs, helping students build systematic debugging habits and write cleaner, modular code.

## Achievements & Coding Profiles
* **LeetCode:** 900+ problems solved, Max Contest Rating 1750, 365-day active streak.
* **Coding Profiles:** CodeChef: 3-Star Coder (Max Rating 1680), Codeforces: Pupil (Max Rating 1210), AtCoder: Max Rating 970.
* **Hackathon:** Ranked 7th out of 150+ teams for "Hostel Hub", a scalable inventory management system.
* **Coding Contest:** Ranked 1st among all peers in an all-night algorithm sprint hosted by Scaler.

## Projects

### SastaNotebookLM - Retrieval-Augmented Generation Application
* **Tech Stack:** Python, FastAPI, LangChain, Qdrant (Vector DB), Google Gemini Embeddings, React, TypeScript, Tailwind CSS
* **Links:** GitHub, Live Demo
* Architected a production-ready RAG application where users upload PDF/TXT documents and query an LLM grounded strictly in retrieved context, eliminating hallucinations through strict anti-hallucination system prompting.
* Engineered end-to-end pipeline: document ingestion -> recursive chunking (2000 chars, 400 overlap) -> 3072-dim Gemini embedding -> Qdrant indexing -> async Top-10 cosine retrieval, delivering sub-second query response times.
* Deployed React frontend on Vercel with responsive UI; Fast API backend handles concurrent document processing with fully async retrieval.

### WEB-AUTOMATION-AGENT - Agentic AI Browser Controller
* **Tech Stack:** Python, Playwright, Qwen2.5-VL-72B (Vision-Language Model), HuggingFace Inference API
* **Links:** GitHub
* Designed and shipped an autonomous agent that controls a real Chromium browser: screenshot -> 72B-parameter VLM inference -> JSON tool-call parsing -> Playwright execution -> loop until task completion, with zero human input mid-run.
* Structured a 6-tool modular system (click, double-click, type, scroll-up, scroll-down, done) using a shared browser-state singleton; handles form filling, navigation, and multi-step web tasks end-to-end.

### Multithreaded HTTP/1.1 Server - Systems Programming
* **Tech Stack:** Python, Socket Programming, Threading, gzip Compression
* **Links:** GitHub
* Constructed a fully compliant HTTP/1.1 server from scratch: thread-pool concurrency, GET/POST routing, gzip compression, and directory-traversal security no frameworks used.
* Authored a 54-test regression suite covering malformed headers, path traversal attacks, large payloads, and concurrent stress loads, achieving 100% pass rate on all edge cases.

### Lost-n-Found - Full-Stack Real-Time Platform
* **Tech Stack:** MongoDB, Express.js, React.js, Node.js (MERN), Socket.IO, Google OAuth 2.0, JWT
* **Links:** GitHub
* Delivered a scalable MERN-stack platform connecting users via real-time bidirectional messaging (Socket.IO), managing state across multiple concurrent chat sessions.
* Designed a RESTful API layer with structured error handling and secure authentication via Google OAuth 2.0 and JWT-based session management.

### Persona-AI - Multi-Persona AI Chatbot
* **Tech Stack:** Python, FastAPI, React, TypeScript, Tailwind CSS, LLM API, Vercel
* **Links:** GitHub, Live Demo
* Created a multi-persona AI chatbot where each persona maintains isolated conversation context, context-specific suggestion chips, and system-prompt-driven behaviour switching deployed full-stack on Vercel.
* Crafted a responsive frontend with typing indicators, graceful error boundaries, and mobile-first layout.

### Sleep Quality Analytics Engine - Machine Learning
* **Tech Stack:** Python, Scikit-learn, Pandas, SMOTE, Random Forest, GridSearchCV
* **Links:** Project Drive
* Trained a predictive model for sleep quality classification, achieving a 25% reduction in misclassifications by applying SMOTE oversampling to correct class imbalance across health datasets.
* Reached 86.0% accuracy with a Random Forest classifier tuned via GridSearchCV across multiple hyperparameter configurations.