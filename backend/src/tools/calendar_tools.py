"""Cal.com v2 calendar tools.

Implements five async tool functions for calendar operations:
  - check_availability   — list free slots on a date
  - book_slot            — create a new booking
  - cancel_booking       — delete an existing booking
  - reschedule_booking   — move an existing booking
  - list_bookings        — fetch bookings by status

All functions return a ToolResult with a consistent shape.
If CAL_API_KEY is not set, each function returns a mock success response
so the rest of the pipeline can be developed / tested without live credentials.
"""
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional

import httpx

from src.config import CAL_API_KEY, CAL_EVENT_TYPE_ID, CAL_BASE_URL
from src.tools.base import ToolResult

logger = logging.getLogger(__name__)

_http_client: httpx.AsyncClient | None = None

def _get_http_client() -> httpx.AsyncClient:
    """Return a shared httpx client with connection pooling."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=15.0)
    return _http_client

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Each endpoint group in Cal.com v2 uses its own API version header.
_CAL_API_VERSION_SLOTS = "2024-09-04"      # GET /v2/slots
_CAL_API_VERSION_BOOKINGS = "2026-02-25"   # POST/GET /v2/bookings, cancel, reschedule
_IST = ZoneInfo("Asia/Kolkata")


def _headers(version: str = _CAL_API_VERSION_SLOTS) -> dict[str, str]:
    """Return Cal.com v2 request headers with the appropriate API version."""
    return {
        "Authorization": f"Bearer {CAL_API_KEY}",
        "cal-api-version": version,
        "Content-Type": "application/json",
    }


def _to_iso(date: str, time_slot: str, tz_name: str) -> str:
    """Convert 'YYYY-MM-DD' + 'HH:MM' → ISO-8601 string with the requested timezone offset.

    Example:
        _to_iso("2026-06-10", "10:00", "Asia/Kolkata") → "2026-06-10T10:00:00+05:30"
    """
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = _IST
    return (
        datetime.strptime(f"{date} {time_slot}", "%Y-%m-%d %H:%M")
        .replace(tzinfo=tz)
        .isoformat()
    )


# ---------------------------------------------------------------------------
# Tool 1: check_availability
# ---------------------------------------------------------------------------

async def check_availability(
    date: str,
    timezone: str = "Asia/Kolkata",
) -> ToolResult:
    """Check available interview slots on a given date via Cal.com v2.

    Args:
        date:     Date to check, format YYYY-MM-DD (e.g. "2026-06-10").
        timezone: IANA timezone string for the attendee. Defaults to IST.

    Returns:
        ToolResult with data={"date": str, "slots": list[str], "count": int}
        where slots are HH:MM strings. On failure, success=False with an
        error code and human-readable message.

    Mock behaviour (no CAL_API_KEY):
        Returns a static list of 5 slots so downstream logic can be tested.
    """
    if not CAL_API_KEY:
        logger.warning("[tools/calendar] CAL_API_KEY not set — returning dynamic mock slots.")
        try:
            tz = ZoneInfo(timezone)
        except Exception:
            tz = _IST
        try:
            now = datetime.now(tz)
            requested_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            return ToolResult(
                success=False,
                error="invalid_date",
                message=f"Invalid date format: '{date}'. Please use YYYY-MM-DD.",
            )
        mock_slots = []
        start_hour = 9  # default start 9 AM
        if requested_date == now.date():
            start_hour = max(9, now.hour + 1)
        elif requested_date < now.date():
            start_hour = 18  # no slots in the past
        
        for h in range(start_hour, 18):  # up to 5 PM
            mock_slots.append(f"{h:02d}:00")
            mock_slots.append(f"{h:02d}:30")

        if not mock_slots:
            return ToolResult(
                success=True,
                data={"date": date, "slots": [], "count": 0},
                message=f"No slots available on {date}.",
            )

        return ToolResult(
            success=True,
            data={"date": date, "slots": mock_slots, "count": len(mock_slots)},
            message=f"Mock slots for {date}: {', '.join(mock_slots)}",
        )

    try:
        tz = ZoneInfo(timezone)
    except Exception:
        tz = _IST

    try:
        dt_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return ToolResult(
            success=False,
            error="invalid_date",
            message=f"Invalid date format: '{date}'. Please use YYYY-MM-DD.",
        )

    start_dt = dt_date.replace(tzinfo=tz)
    end_dt = datetime.strptime(f"{date} 23:59:59", "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz)

    start_time = start_dt.isoformat()
    end_time = end_dt.isoformat()

    try:
        client = _get_http_client()
        response = await client.get(
            f"{CAL_BASE_URL}/slots",
            params={
                "eventTypeId": CAL_EVENT_TYPE_ID,
                "start": start_time,
                "end": end_time,
            },
            headers=_headers(_CAL_API_VERSION_SLOTS),
        )
        response.raise_for_status()

        data = response.json()
        # v2 response shape: {"data": {"2026-06-10": [{"start": "..."}, ...]}}
        slots_dict = data.get("data", {})
        date_entries: list = []
        if isinstance(slots_dict, dict):
            for value in slots_dict.values():
                if isinstance(value, list):
                    date_entries.extend(value)
        elif isinstance(slots_dict, list):
            date_entries.extend(slots_dict)

        slots: list[str] = []
        for slot in date_entries:
            time_str: str = slot.get("start", "")
            if not time_str:
                continue
            try:
                dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                # Convert to requested timezone for display
                tz_dt = dt.astimezone(tz)
                # Only include slots that fall on the requested local date
                if tz_dt.strftime("%Y-%m-%d") == date:
                    slots.append(tz_dt.strftime("%H:%M"))
            except ValueError:
                # Skip invalid slots
                continue

        if not slots:
            return ToolResult(
                success=True,
                data={"date": date, "slots": [], "count": 0},
                message=f"No slots available on {date}.",
            )

        return ToolResult(
            success=True,
            data={"date": date, "slots": slots, "count": len(slots)},
            message=f"Found {len(slots)} available slots on {date}.",
        )

    except httpx.HTTPStatusError as e:
        logger.error("[tools/calendar] check_availability HTTP error: %s", e)
        return ToolResult(
            success=False,
            error="api_error",
            message=f"Cal.com API error {e.response.status_code}: {e.response.text[:200]}",
        )
    except Exception as e:
        logger.error("[tools/calendar] check_availability unexpected error: %s", e)
        return ToolResult(
            success=False,
            error="system_error",
            message=f"Could not check availability: {e}",
        )


# ---------------------------------------------------------------------------
# Tool 2: book_slot
# ---------------------------------------------------------------------------

async def book_slot(
    date: str,
    time: str,
    email: str,
    name: str = "Interviewer",
    timezone: str = "Asia/Kolkata",
) -> ToolResult:
    """Book an interview slot via Cal.com v2.

    Args:
        date:      Booking date in YYYY-MM-DD format.
        time:      Booking start time in HH:MM (24-hr) format.
        email:     Attendee email address.
        name:      Attendee display name. Defaults to "Interviewer".
        timezone:  IANA timezone for the attendee. Defaults to IST.

    Returns:
        ToolResult with data={"booking_id", "date", "time", "email", "meet_url"}
        on success. On 409/400, returns error="slot_unavailable" so the
        caller can suggest alternative times. On 422, parses the validation
        error for a helpful message.

    Mock behaviour (no CAL_API_KEY):
        Returns success with booking_id="mock-12345".
    """
    if not CAL_API_KEY:
        logger.warning("[tools/calendar] CAL_API_KEY not set — returning mock booking.")
        return ToolResult(
            success=True,
            data={
                "booking_id": "mock-12345",
                "date": date,
                "time": time,
                "email": email,
                "meet_url": "",
            },
            message=(
                f"Interview confirmed for {date} at {time}. "
                f"Confirmation sent to {email}."
            ),
        )

    try:
        start_iso = _to_iso(date, time, timezone)
    except ValueError:
        return ToolResult(
            success=False,
            error="invalid_datetime",
            message=f"Invalid date ({date}) or time ({time}) format. Use YYYY-MM-DD and HH:MM.",
        )

    payload = {
        "eventTypeId": int(CAL_EVENT_TYPE_ID) if CAL_EVENT_TYPE_ID else 0,
        "start": start_iso,
        "attendee": {
            "name": name,
            "email": email,
            "timeZone": timezone,
            "language": "en",
        },
    }

    try:
        client = _get_http_client()
        response = await client.post(
            f"{CAL_BASE_URL}/bookings",
            headers=_headers(_CAL_API_VERSION_BOOKINGS),
            json=payload,
        )

        if response.status_code in (400, 409):
            return ToolResult(
                success=False,
                error="slot_unavailable",
                message="That slot is no longer available. Please choose another time.",
            )

        if response.status_code == 422:
            try:
                err_body = response.json()
                detail = err_body.get("message") or err_body.get("error") or str(err_body)
            except Exception:
                detail = response.text[:300]
            return ToolResult(
                success=False,
                error="validation_error",
                message=f"Booking validation failed: {detail}",
            )

        response.raise_for_status()

        data = response.json()
        booking_data: dict = data.get("data", data)  # v2 wraps in "data"
        booking_id = str(
            booking_data.get("uid") or booking_data.get("id") or "unknown"
        )
        meet_url: str = booking_data.get("meetingUrl", "")

        return ToolResult(
            success=True,
            data={
                "booking_id": booking_id,
                "date": date,
                "time": time,
                "email": email,
                "meet_url": meet_url,
            },
            message=(
                f"Interview confirmed for {date} at {time}. "
                f"Confirmation sent to {email}."
            ),
        )

    except httpx.HTTPStatusError as e:
        logger.error("[tools/calendar] book_slot HTTP error: %s", e)
        return ToolResult(
            success=False,
            error="api_error",
            message=f"Booking failed (HTTP {e.response.status_code}): {e.response.text[:200]}",
        )
    except Exception as e:
        logger.error("[tools/calendar] book_slot unexpected error: %s", e)
        return ToolResult(
            success=False,
            error="system_error",
            message=f"Booking failed unexpectedly: {e}",
        )


# ---------------------------------------------------------------------------
# Tool 3: cancel_booking
# ---------------------------------------------------------------------------

async def cancel_booking(
    booking_id: str,
    reason: str = "Cancelled via AI assistant",
) -> ToolResult:
    """Cancel an existing Cal.com booking.

    Args:
        booking_id: The Cal.com booking UID/ID to cancel.
        reason:     Human-readable cancellation reason sent to Cal.com.

    Returns:
        ToolResult(success=True) on success, error="not_found" on 404.

    Mock behaviour (no CAL_API_KEY):
        Returns success immediately.
    """
    if not CAL_API_KEY:
        logger.warning("[tools/calendar] CAL_API_KEY not set — mock cancel.")
        return ToolResult(
            success=True,
            message=f"Booking {booking_id} cancelled (mock).",
        )

    try:
        client = _get_http_client()
        response = await client.post(
            f"{CAL_BASE_URL}/bookings/{booking_id}/cancel",
            headers=_headers(_CAL_API_VERSION_BOOKINGS),
            json={"cancellationReason": reason},
        )

        if response.status_code == 404:
            return ToolResult(
                success=False,
                error="not_found",
                message=f"Booking {booking_id} not found.",
            )

        response.raise_for_status()

        return ToolResult(
            success=True,
            message=f"Booking {booking_id} has been cancelled successfully.",
        )

    except httpx.HTTPStatusError as e:
        logger.error("[tools/calendar] cancel_booking HTTP error: %s", e)
        return ToolResult(
            success=False,
            error="api_error",
            message=f"Cancellation failed (HTTP {e.response.status_code}): {e.response.text[:200]}",
        )
    except Exception as e:
        logger.error("[tools/calendar] cancel_booking unexpected error: %s", e)
        return ToolResult(
            success=False,
            error="system_error",
            message=f"Cancellation failed: {e}",
        )


# ---------------------------------------------------------------------------
# Tool 4: reschedule_booking
# ---------------------------------------------------------------------------

async def reschedule_booking(
    booking_id: str,
    new_date: str,
    new_time_slot: str,
    timezone: str = "Asia/Kolkata",
    reason: str = "Rescheduled via AI assistant",
) -> ToolResult:
    """Reschedule an existing Cal.com booking to a new date/time.

    Args:
        booking_id:    Booking UID/ID to reschedule.
        new_date:      New date in YYYY-MM-DD format.
        new_time_slot: New start time in HH:MM (24-hr) format.
        reason:        Human-readable rescheduling reason.

    Returns:
        ToolResult with data={"booking_id", "new_date", "new_time"} on success.

    Mock behaviour (no CAL_API_KEY):
        Returns success immediately.
    """
    if not CAL_API_KEY:
        logger.warning("[tools/calendar] CAL_API_KEY not set — mock reschedule.")
        return ToolResult(
            success=True,
            data={"booking_id": booking_id, "new_date": new_date, "new_time": new_time_slot},
            message=f"Booking rescheduled to {new_date} at {new_time_slot} (mock).",
        )

    try:
        new_start_iso = _to_iso(new_date, new_time_slot, timezone)
    except ValueError:
        return ToolResult(
            success=False,
            error="invalid_datetime",
            message=f"Invalid date ({new_date}) or time ({new_time_slot}) format. Use YYYY-MM-DD and HH:MM.",
        )

    try:
        client = _get_http_client()
        response = await client.post(
            f"{CAL_BASE_URL}/bookings/{booking_id}/reschedule",
            headers=_headers(_CAL_API_VERSION_BOOKINGS),
            json={
                "start": new_start_iso,
                "reschedulingReason": reason,
            },
        )
        response.raise_for_status()

        return ToolResult(
            success=True,
            data={
                "booking_id": booking_id,
                "new_date": new_date,
                "new_time": new_time_slot,
            },
            message=f"Booking rescheduled to {new_date} at {new_time_slot}.",
        )

    except httpx.HTTPStatusError as e:
        logger.error("[tools/calendar] reschedule_booking HTTP error: %s", e)
        return ToolResult(
            success=False,
            error="api_error",
            message=f"Reschedule failed (HTTP {e.response.status_code}): {e.response.text[:200]}",
        )
    except Exception as e:
        logger.error("[tools/calendar] reschedule_booking unexpected error: %s", e)
        return ToolResult(
            success=False,
            error="system_error",
            message=f"Reschedule failed: {e}",
        )


# ---------------------------------------------------------------------------
# Tool 5: list_bookings
# ---------------------------------------------------------------------------

async def list_bookings(status: str = "upcoming") -> ToolResult:
    """List Cal.com bookings filtered by status.

    Args:
        status: One of "upcoming", "past", "cancelled". Defaults to "upcoming".

    Returns:
        ToolResult with data={"bookings": list[dict], "count": int}.
        Each booking dict has keys: id, title, start, email.

    Mock behaviour (no CAL_API_KEY):
        Returns an empty bookings list.
    """
    if not CAL_API_KEY:
        logger.warning("[tools/calendar] CAL_API_KEY not set — returning empty bookings list.")
        return ToolResult(
            success=True,
            data={"bookings": [], "count": 0},
            message="No bookings found (mock mode — CAL_API_KEY not set).",
        )

    try:
        client = _get_http_client()
        response = await client.get(
            f"{CAL_BASE_URL}/bookings",
            params={"status": status},
            headers=_headers(_CAL_API_VERSION_BOOKINGS),
        )
        response.raise_for_status()

        data = response.json()
        raw_bookings = data.get("data", [])
        if not isinstance(raw_bookings, list):
            raw_bookings = [raw_bookings] if isinstance(raw_bookings, dict) else []

        bookings: list[dict] = []
        for b in raw_bookings:
            attendees = b.get("attendees", [])
            email = attendees[0].get("email", "") if (isinstance(attendees, list) and len(attendees) > 0 and isinstance(attendees[0], dict)) else ""
            bookings.append(
                {
                    "id": b.get("uid") or b.get("id", ""),
                    "title": b.get("title", ""),
                    "start": b.get("start", ""),
                    "email": email,
                }
            )

        return ToolResult(
            success=True,
            data={"bookings": bookings, "count": len(bookings)},
            message=f"Found {len(bookings)} {status} bookings.",
        )

    except httpx.HTTPStatusError as e:
        logger.error("[tools/calendar] list_bookings HTTP error: %s", e)
        return ToolResult(
            success=False,
            error="api_error",
            message=f"Failed to list bookings (HTTP {e.response.status_code}): {e.response.text[:200]}",
        )
    except Exception as e:
        logger.error("[tools/calendar] list_bookings unexpected error: %s", e)
        return ToolResult(
            success=False,
            error="system_error",
            message=f"Failed to list bookings: {e}",
        )
