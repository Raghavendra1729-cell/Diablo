import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Mail } from 'lucide-react';

export function BookingWidget({ date, slotsStr, onConfirm, disabled }) {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const slots = slotsStr
    ? slotsStr.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSlot && name && email && !disabled) {
      onConfirm(
        `Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`
      );
    }
  };

  return (
    <div className="mt-4 glass rounded-2xl shadow-sm overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/8 to-accent/4 px-5 py-3.5 border-b border-border/50">
        <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule Meeting for {date}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Slot Picker */}
        <div role="group" aria-labelledby={`booking-time-label-${date}`}>
          <div
            id={`booking-time-label-${date}`}
            className="text-xs font-semibold text-secondary mb-2 flex items-center gap-1.5"
          >
            <Clock className="w-3 h-3" />
            Select a Time
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                aria-pressed={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  selectedSlot === slot
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'bg-white text-primary border border-border hover:border-accent hover:bg-accent/5'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        {selectedSlot && (
          <div className="space-y-3 pt-3 border-t border-border animate-slide-up">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/50 pointer-events-none" />
              <Input
                type="text"
                required
                placeholder="Your Full Name"
                aria-label="Your Full Name"
                className="bg-white border-border focus-visible:ring-accent/50 pl-9 h-9 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/50 pointer-events-none" />
              <Input
                type="email"
                required
                placeholder="Your Email Address"
                aria-label="Your Email Address"
                className="bg-white border-border focus-visible:ring-accent/50 pl-9 h-9 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
              />
            </div>
            <Button
              type="submit"
              disabled={disabled}
              className="w-full bg-gradient-to-r from-accent to-accent2 text-white font-semibold rounded-xl shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all h-10"
            >
              Confirm Meeting
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
