import { useState } from 'react';
import { useCalendar } from '@/models/useCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Mail, Loader2, AlertCircle, Inbox } from 'lucide-react';

export function CalendarWidget({ onConfirm, disabled }) {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { slots, loading, error, fetchSlots } = useCalendar();

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    setSelectedSlot('');
    fetchSlots(d);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (date && selectedSlot && name && email && !disabled) {
      onConfirm(`Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`);
    }
  };

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  return (
    <div className="mt-4 glass rounded-2xl shadow-sm overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/8 to-accent/4 px-5 py-3.5 border-b border-border/50">
        <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule a Meeting
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Date Picker */}
        <div>
          <label
            htmlFor="calendar-date"
            className="text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3 h-3" />
            Select a Date
          </label>
          <Input
            id="calendar-date"
            type="date"
            required
            min={localToday}
            disabled={disabled}
            className="bg-white border-border focus-visible:ring-accent/50 text-sm h-9"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-xs font-medium text-secondary animate-pulse" role="status">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading available slots...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium text-danger bg-danger/5 rounded-lg px-3 py-2" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* No slots */}
        {date && !loading && !error && slots.length === 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-secondary bg-muted/50 rounded-lg px-3 py-2" role="status">
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            No slots available on this date.
          </div>
        )}

        {/* Slot Picker */}
        {date && slots.length > 0 && (
          <div className="animate-slide-up" role="group" aria-labelledby="calendar-time-label">
            <div
              id="calendar-time-label"
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
                  disabled={disabled}
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
        )}

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
                disabled={disabled}
                className="bg-white border-border focus-visible:ring-accent/50 pl-9 h-9 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/50 pointer-events-none" />
              <Input
                type="email"
                required
                placeholder="Your Email Address"
                aria-label="Your Email Address"
                disabled={disabled}
                className="bg-white border-border focus-visible:ring-accent/50 pl-9 h-9 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={disabled || loading}
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
