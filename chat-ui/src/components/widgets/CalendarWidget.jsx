import { useState } from 'react';
import { useCalendar } from '@/models/useCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CalendarWidget({ onConfirm, disabled }) {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const { slots, loading, error, fetchSlots } = useCalendar();

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    fetchSlots(d);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (date && selectedSlot && name && email && !disabled) {
      onConfirm(`Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`);
    }
  };

  const today = new Date();
  const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  return (
    <div className="mt-4 p-5 glass rounded-2xl shadow-lg shadow-black/20">
      <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider mb-3">Schedule a Meeting</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="calendar-date" className="text-xs font-semibold text-secondary mb-1.5 block">Select a Date</label>
          <Input 
            id="calendar-date"
            type="date" 
            required 
            min={localToday}
            disabled={disabled}
            className="bg-elevated border-border focus-visible:ring-accent/50"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {loading && <p className="text-xs font-medium text-secondary animate-pulse" role="status">Loading available slots...</p>}
        {error && <p className="text-xs font-medium text-red-500" role="alert">{error}</p>}
        
        {date && !loading && !error && slots.length === 0 && (
          <p className="text-xs font-medium text-secondary" role="status">No slots available on this date.</p>
        )}

        {date && slots.length > 0 && (
          <div className="animate-slide-up" role="group" aria-labelledby="calendar-time-label">
            <div id="calendar-time-label" className="text-xs font-semibold text-secondary mb-1.5 block">Select a Time</div>
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selectedSlot === slot}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    selectedSlot === slot 
                      ? 'bg-accent text-blue-900 shadow-md' 
                      : 'bg-elevated text-primary border border-border hover:border-accent/50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {selectedSlot && (
          <div className="space-y-2 pt-2 animate-slide-up border-t border-border/50 mt-3">
            <Input 
              type="text" 
              required 
              placeholder="Your Full Name" 
              aria-label="Your Full Name"
              disabled={disabled}
              className="bg-elevated border-border focus-visible:ring-accent/50"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Input 
              type="email" 
              required 
              placeholder="Your Email Address" 
              aria-label="Your Email Address"
              disabled={disabled}
              className="bg-elevated border-border focus-visible:ring-accent/50"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button 
              type="submit"
              disabled={disabled || loading}
              className="w-full mt-2 bg-gradient-to-r from-accent to-accent2 text-blue-900 font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all h-10"
            >
              Confirm Meeting
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
