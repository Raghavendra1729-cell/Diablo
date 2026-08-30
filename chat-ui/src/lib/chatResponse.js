const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseChatResponse(data) {
  if (!isObject(data) || typeof data.response !== 'string' || !data.response.trim()) {
    throw new Error('The server returned an invalid chat response.');
  }

  let ui = null;
  if (data.ui !== null && data.ui !== undefined) {
    if (!isObject(data.ui) || !['calendar', 'booking'].includes(data.ui.type)) {
      throw new Error('The server returned an invalid interface action.');
    }
    if (data.ui.type === 'booking') {
      if (
        typeof data.ui.date !== 'string' ||
        !Array.isArray(data.ui.slots) ||
        data.ui.slots.some((slot) => typeof slot !== 'string' || !TIME_PATTERN.test(slot))
      ) {
        throw new Error('The server returned invalid booking availability.');
      }
    }
    ui = data.ui;
  }

  let bookingDetails = null;
  if (data.booking_confirmed) {
    if (!isObject(data.booking_details)) {
      throw new Error('The booking confirmation was incomplete.');
    }
    const required = ['booking_id', 'date', 'time', 'email'];
    if (required.some((key) => typeof data.booking_details[key] !== 'string')) {
      throw new Error('The booking confirmation was malformed.');
    }
    bookingDetails = data.booking_details;
  }

  return {
    response: data.response.trim(),
    ui,
    bookingConfirmed: Boolean(data.booking_confirmed),
    bookingDetails,
  };
}
