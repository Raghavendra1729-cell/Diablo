import test from 'node:test';
import assert from 'node:assert/strict';

import { parseChatResponse } from '../src/lib/chatResponse.js';

test('accepts a strict booking interface response', () => {
  const result = parseChatResponse({
    response: 'Choose a time.',
    ui: { type: 'booking', date: '2026-09-01', slots: ['09:30', '14:00'] },
    booking_confirmed: false,
    booking_details: null,
  });

  assert.equal(result.response, 'Choose a time.');
  assert.deepEqual(result.ui.slots, ['09:30', '14:00']);
});

test('rejects prose and malformed booking slots', () => {
  assert.throws(() => parseChatResponse('Choose a time.'), /invalid chat response/);
  assert.throws(
    () => parseChatResponse({
      response: 'Choose a time.',
      ui: { type: 'booking', date: '2026-09-01', slots: ['9:30 AM'] },
    }),
    /invalid booking availability/,
  );
});

test('requires complete details for confirmed bookings', () => {
  assert.throws(
    () => parseChatResponse({ response: 'Booked.', booking_confirmed: true }),
    /confirmation was incomplete/,
  );
});
