export function buildChatHistory(messages) {
  return messages
    .filter((message) => !message.isError)
    .map((message) => ({
      role: message.role,
      content: message.booking_details
        ? `${message.content}\n[Booking ID: ${message.booking_details.booking_id}]`
        : message.content,
    }))
    .slice(-20);
}
