import os
import requests
import json
import sys
import time
from typing import Optional


class VapiAssistant:
    """Create and manage Vapi Voice Assistants via REST API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.vapi.ai",
    ):
        self.api_key = api_key or os.environ.get("VAPI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "VAPI_API_KEY required. Pass `api_key=` or set env var."
            )
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.base_url}{path}"
        response = self.session.request(method, url, **kwargs)
        try:
            body = response.json()
        except json.JSONDecodeError:
            body = {"raw": response.text}

        if not response.ok:
            raise requests.HTTPError(
                f"{method} {url} -> {response.status_code}: {json.dumps(body, indent=2)}",
                response=response,
            )
        return body

    def create_assistant(self, config: dict) -> dict:
        """Create or update an assistant with the given configuration."""
        return self._request("POST", "/assistant", json=config)

    def get_assistant(self, assistant_id: str) -> dict:
        return self._request("GET", f"/assistant/{assistant_id}")

    def update_assistant(self, assistant_id: str, config: dict) -> dict:
        return self._request("PATCH", f"/assistant/{assistant_id}", json=config)

    def delete_assistant(self, assistant_id: str) -> bool:
        self._request("DELETE", f"/assistant/{assistant_id}")
        return True

    def list_assistants(self, limit: int = 100) -> list:
        return self._request("GET", f"/assistant?limit={limit}")


def build_booking_tools() -> list:
    """Return tool definitions for booking-related actions."""
    return [
        {
            "type": "function",
            "function": {
                "name": "check_availability",
                "description": "Check available time slots for a given date and service.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "date": {
                            "type": "string",
                            "description": "Date in YYYY-MM-DD format.",
                        },
                        "service": {
                            "type": "string",
                            "description": "Service type (e.g. consultation, follow-up, support).",
                        },
                    },
                    "required": ["date", "service"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "book_appointment",
                "description": "Book an appointment at a specific date and time.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "date": {
                            "type": "string",
                            "description": "Date in YYYY-MM-DD format.",
                        },
                        "time": {
                            "type": "string",
                            "description": "Time in HH:MM format (24-hour).",
                        },
                        "service": {
                            "type": "string",
                            "description": "Service type to book.",
                        },
                        "customer_name": {
                            "type": "string",
                            "description": "Full name of the customer.",
                        },
                        "customer_email": {
                            "type": "string",
                            "description": "Email address for confirmation.",
                        },
                        "notes": {
                            "type": "string",
                            "description": "Optional additional notes or special requests.",
                        },
                    },
                    "required": [
                        "date",
                        "time",
                        "service",
                        "customer_name",
                        "customer_email",
                    ],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "cancel_appointment",
                "description": "Cancel an existing appointment by booking reference.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "booking_ref": {
                            "type": "string",
                            "description": "The booking reference ID to cancel.",
                        },
                        "customer_email": {
                            "type": "string",
                            "description": "Email used during booking for verification.",
                        },
                    },
                    "required": ["booking_ref", "customer_email"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "reschedule_appointment",
                "description": "Move an existing appointment to a new date/time.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "booking_ref": {
                            "type": "string",
                            "description": "The booking reference ID to reschedule.",
                        },
                        "new_date": {
                            "type": "string",
                            "description": "New date in YYYY-MM-DD format.",
                        },
                        "new_time": {
                            "type": "string",
                            "description": "New time in HH:MM format (24-hour).",
                        },
                        "customer_email": {
                            "type": "string",
                            "description": "Email used during booking for verification.",
                        },
                    },
                    "required": ["booking_ref", "new_date", "new_time", "customer_email"],
                },
            },
        },
    ]


def build_assistant_config(
    name: str,
    backend_url: str,
    first_message: str = "Hello! How can I help you today?",
    voice_provider: str = "vapi",
    voice_id: str = "Elliot",
    system_prompt: str = "",
    silence_timeout_seconds: int = 30,
    max_duration_seconds: int = 900,
    background_denoising: bool = True,
    end_call_message: str = "Thank you for calling. Goodbye!",
    end_call_phrases: list | None = None,
) -> dict:
    """
    Build a Vapi assistant configuration dict for a Custom LLM backend.

    Args:
        name: Display name for the assistant in the Vapi dashboard.
        backend_url: Your SSE-compatible OpenAI-format endpoint.
        first_message: First thing the assistant says when the call starts.
        voice_provider: TTS provider ("vapi", "11labs", "azure", etc.).
        voice_id: Voice identifier for the chosen provider.
        system_prompt: System-level instructions for the LLM.
        silence_timeout_seconds: Hang up after N seconds of silence.
        max_duration_seconds: Maximum call duration before auto-hangup.
        background_denoising: Enable Krisp background noise removal.
        end_call_message: Message spoken before hanging up.
        end_call_phrases: List of phrases that trigger call end.

    Returns:
        Complete assistant configuration dict ready for the Vapi API.
    """
    if end_call_phrases is None:
        end_call_phrases = [
            "goodbye",
            "bye",
            "thank you goodbye",
            "have a great day",
        ]

    tools = build_booking_tools()

    config = {
        "name": name,
        "model": {
            "provider": "custom-llm",
            "url": backend_url,
            "metadata": {
                "stream": True,
            },
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt or (
                        "You are a helpful, professional voice assistant. "
                        "Speak clearly and concisely. Help users check availability, "
                        "book, reschedule, or cancel appointments. Confirm all "
                        "details before finalizing any booking."
                    ),
                },
            ],
            "tools": tools,
            "toolCallParameters": {
                "type": "auto",
            },
        },
        "voice": {
            "provider": voice_provider,
            "voiceId": voice_id,
        },
        "firstMessage": first_message,
        "silenceTimeoutSeconds": silence_timeout_seconds,
        "maxDurationSeconds": max_duration_seconds,
        "backgroundDenoisingEnabled": background_denoising,
        "endCallMessage": end_call_message,
        "endCallPhrases": end_call_phrases,
        "transcriber": {
            "provider": "deepgram",
            "model": "nova-2",
            "language": "en",
        },
        "server": {
            "url": backend_url,
        },
        "recordingEnabled": True,
    }

    return config


if __name__ == "__main__":
    # --- Configuration ---
    BACKEND_URL = os.environ.get(
        "BACKEND_URL",
        "https://your-huggingface-space.hf.space/chat/completions",
    )
    VAPI_API_KEY = os.environ.get("VAPI_API_KEY")

    if not VAPI_API_KEY:
        print("ERROR: Set VAPI_API_KEY environment variable.", file=sys.stderr)
        sys.exit(1)

    # --- Build config ---
    assistant_config = build_assistant_config(
        name="Booking Assistant",
        backend_url=BACKEND_URL,
        first_message="Hello! I'm your booking assistant. How can I help you today?",
        voice_provider="vapi",
        voice_id="Elliot",
        system_prompt=(
            "You are a friendly and efficient voice assistant for booking appointments. "
            "Follow this workflow:\n"
            "1. Greet the caller and ask how you can help.\n"
            "2. If they want to book: ask for the service type, then check availability "
            "using the check_availability tool.\n"
            "3. Present available time slots clearly — no more than 5 at a time.\n"
            "4. Once they pick a slot, collect name and email, then call book_appointment.\n"
            "5. Confirm the booking reference with the customer.\n"
            "6. For cancellations or reschedules: verify identity with email first.\n"
            "7. Keep responses under 2 sentences. Speak naturally, not like a robot."
        ),
        silence_timeout_seconds=30,
        max_duration_seconds=900,
        end_call_phrases=[
            "goodbye",
            "bye",
            "thank you goodbye",
            "have a great day",
        ],
    )

    # --- Create assistant ---
    vapi = VapiAssistant(api_key=VAPI_API_KEY)

    try:
        result = vapi.create_assistant(assistant_config)
        assistant_id = result.get("id", "unknown")
        print(f"Assistant created successfully.")
        print(f"ID: {assistant_id}")
        print(f"Name: {result.get('name', 'N/A')}")
        print(f"Org ID: {result.get('orgId', 'N/A')}")
        print(f"\nConfig written to: .vapi_assistant_{assistant_id}.json")

        # Save full response for reference
        with open(f".vapi_assistant_{assistant_id}.json", "w") as f:
            json.dump(result, f, indent=2)

    except requests.HTTPError as e:
        print(f"API Error: {e}", file=sys.stderr)
        sys.exit(1)
    except requests.RequestException as e:
        print(f"Network Error: {e}", file=sys.stderr)
        sys.exit(1)
