import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Mail } from 'lucide-react';

export function BookingWidget({ date, slots, onConfirm, disabled }) {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const timeLabelId = useId();
  const nameId = useId();
  const emailId = useId();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSlot && name && email && !disabled) {
      onConfirm(
        `Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`
      );
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-lg overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-zinc-900/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          Available Times for {date}
        </h3>
        <span className="text-[10px] text-zinc-400 font-mono">Cal.com</span>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Slot Picker */}
        <div role="group" aria-labelledby={timeLabelId}>
          <div
            id={timeLabelId}
            className="text-xs font-medium text-zinc-400 mb-2.5 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Select a Time Slot
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                disabled={disabled}
                aria-pressed={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedSlot === slot
                    ? 'bg-orange-500 text-zinc-950 font-semibold shadow-md'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/80'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        {selectedSlot && (
          <div className="space-y-3 pt-3 border-t border-zinc-800 animate-slide-up">
            <div>
              <label htmlFor={nameId} className="block text-xs font-medium text-zinc-400 mb-1.5">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <Input
                  id={nameId}
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  aria-label="Your Full Name"
                  className="bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50 pl-9 h-9 text-xs rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <label htmlFor={emailId} className="block text-xs font-medium text-zinc-400 mb-1.5">
                Work or Personal Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <Input
                  id={emailId}
                  type="email"
                  required
                  placeholder="alex@company.com"
                  aria-label="Your Email Address"
                  className="bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-500/50 pl-9 h-9 text-xs rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={disabled}
              className="w-full bg-orange-500 hover:bg-orange-600 text-zinc-950 font-semibold rounded-lg shadow-md transition-all h-9 text-xs mt-2"
            >
              Confirm Interview Booking
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
