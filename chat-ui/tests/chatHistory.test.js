import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatHistory } from '../src/lib/chatHistory.js';

test('does not duplicate the current message in request history', () => {
  assert.deepEqual(buildChatHistory([
    { role: 'user', content: 'Earlier question' },
    { role: 'assistant', content: 'Earlier answer' },
  ]), [
    { role: 'user', content: 'Earlier question' },
    { role: 'assistant', content: 'Earlier answer' },
  ]);
});

test('omits errors and retains booking ID context', () => {
  assert.deepEqual(buildChatHistory([
    { role: 'assistant', content: 'Booked.', booking_details: { booking_id: 'abc' } },
    { role: 'assistant', content: 'Timeout', isError: true },
  ]), [{ role: 'assistant', content: 'Booked.\n[Booking ID: abc]' }]);
});
