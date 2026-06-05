# Diablo — Personal AI Chat UI

Chat interface for Diablo, a personal AI assistant representing **Linga Seetha Rama Raghavendra**. Built with React + Vite + Tailwind CSS v4.

## Features

- **Real-time chat** — streaming-like responses from the AI backend
- **Meeting scheduling** — interactive calendar widget with date/slot picker
- **Booking receipts** — confirmed meetings with cancel/reschedule actions
- **Markdown rendering** — full GFM support with syntax-highlighted code blocks
- **Glassmorphism UI** — frosted glass panels, subtle gradients, white+blue theme

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Components | @base-ui/react primitives |
| Icons | lucide-react |
| Markdown | react-markdown + remark-gfm |
| HTTP | axios |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The dev server runs on `http://localhost:5173` by default.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:8000` | Backend API base URL |

Set it in `.env.local`:

```
VITE_BACKEND_URL=http://localhost:8000
```

## Project Structure

```
src/
├── main.jsx                    # Entry point with ErrorBoundary
├── App.jsx                     # Root layout: header, chat, input
├── index.css                   # Theme tokens, glass classes, prose
├── models/
│   ├── useChat.js              # Chat state, send/receive, auto-resize
│   └── useCalendar.js          # Slot fetching from backend
├── components/
│   ├── chat/
│   │   ├── MessageBubble.jsx   # Markdown renderer + widgets
│   │   ├── EmptyState.jsx      # Welcome screen with suggestions
│   │   ├── TypingIndicator.jsx # Loading animation
│   │   ├── SuggestionChip.jsx  # CTA pill buttons
│   │   ├── StatusDot.jsx       # Online/offline indicator
│   │   └── EdgeGlows.jsx       # Ambient background gradients
│   ├── widgets/
│   │   ├── BookingWidget.jsx   # Date + slot meeting scheduler
│   │   ├── CalendarWidget.jsx  # Full calendar date picker + form
│   │   └── BookingReceipt.jsx  # Confirmed booking with actions
│   └── ui/
│       ├── button.jsx          # shadcn Button (base-ui)
│       ├── input.jsx           # shadcn Input (base-ui)
│       └── avatar.jsx          # shadcn Avatar (base-ui)
└── lib/
    └── utils.js                # cn() classname helper
```

## Backend

The chat backend is in `../backend/` (FastAPI). The UI calls:

- `POST /v1/chat` — send message, get AI response
- `GET /v1/calendar/slots?date=YYYY-MM-DD` — fetch available time slots

## Design

- **Typography**: Outfit (headings) + Inter (body)
- **Colors**: White surfaces, blue accent (#3b82f6), slate text
- **Theme**: Glassmorphism with backdrop blur, subtle shadows, light gradients
