import { useId, useState } from 'react';
import { useCalendar } from '@/models/useCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Mail, Loader2, AlertCircle, Inbox } from 'lucide-react';

export function CalendarWidget({ onConfirm, disabled }) {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const dateId = useId();
  const timeLabelId = useId();
  const nameId = useId();
  const emailId = useId();

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
    <div className="mt-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] overflow-hidden animate-slide-up text-black">
      {/* Header */}
      <div className="bg-[#ffde59] px-4 py-3 border-b-2 border-black flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-black">
          <Calendar className="w-4 h-4" />
          Schedule an Interview
        </h3>
        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white border border-black shadow-[1px_1px_0px_0px_#000]">
          Cal.com
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Date Picker */}
        <div>
          <label
            htmlFor={dateId}
            className="block text-xs font-bold text-black mb-1.5"
          >
            Select Date
          </label>
          <Input
            id={dateId}
            type="date"
            required
            min={localToday}
            disabled={disabled}
            className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black font-bold text-xs h-9 rounded-lg focus-visible:ring-black"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-xs font-bold text-black py-1" role="status">
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            Checking live availability...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs font-bold text-red-950 bg-[#fee2e2] border-2 border-black rounded-lg px-3 py-2 shadow-[2px_2px_0px_0px_#000]" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            {error}
          </div>
        )}

        {/* No slots */}
        {date && !loading && !error && slots.length === 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 bg-zinc-100 border-2 border-black rounded-lg px-3 py-2 shadow-[2px_2px_0px_0px_#000]" role="status">
            <Inbox className="w-4 h-4 shrink-0" />
            No open interview slots on this date.
          </div>
        )}

        {/* Slot Picker */}
        {date && slots.length > 0 && (
          <div className="animate-slide-up" role="group" aria-labelledby={timeLabelId}>
            <div
              id={timeLabelId}
              className="text-xs font-bold text-black mb-2 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Available Times
            </div>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selectedSlot === slot}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedSlot === slot
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_#ff5c00] translate-x-0.5 translate-y-0.5'
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#ffde59] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
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
          <div className="space-y-3 pt-3 border-t-2 border-black animate-slide-up">
            <div>
              <label htmlFor={nameId} className="block text-xs font-bold text-black mb-1.5">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                <Input
                  id={nameId}
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  aria-label="Your Full Name"
                  disabled={disabled}
                  className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black placeholder:text-zinc-500 pl-9 h-9 text-xs rounded-lg focus-visible:ring-black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor={emailId} className="block text-xs font-bold text-black mb-1.5">
                Work or Personal Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                <Input
                  id={emailId}
                  type="email"
                  required
                  placeholder="alex@company.com"
                  aria-label="Your Email Address"
                  disabled={disabled}
                  className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black placeholder:text-zinc-500 pl-9 h-9 text-xs rounded-lg focus-visible:ring-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={disabled || loading}
              className="w-full bg-[#ff5c00] hover:bg-[#ff7830] text-black font-extrabold rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all h-10 text-xs mt-2 cursor-pointer"
            >
              Confirm Interview Booking
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
