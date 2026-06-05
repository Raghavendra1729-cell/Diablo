import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BookingWidget({ date, slotsStr, onConfirm, disabled }) {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const slots = slotsStr ? slotsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSlot && name && email && !disabled) {
      onConfirm(`Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`);
    }
  };

  return (
    <div className="mt-4 p-5 glass rounded-2xl shadow-lg shadow-black/20">
      <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider mb-3">Schedule Meeting for {date}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div role="group" aria-labelledby={`booking-time-label-${date}`}>
          <div id={`booking-time-label-${date}`} className="text-xs font-semibold text-secondary mb-1.5 block">Select a Time</div>
          <div className="flex flex-wrap gap-2">
            {slots.map(slot => (
              <button
                key={slot}
                type="button"
                aria-pressed={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
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
        
        {selectedSlot && (
          <div className="space-y-2 pt-2 animate-slide-up">
            <Input 
              type="text" 
              required 
              placeholder="Your Full Name" 
              aria-label="Your Full Name"
              className="bg-elevated border-border focus-visible:ring-accent/50"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={disabled}
            />
            <Input 
              type="email" 
              required 
              placeholder="Your Email Address" 
              aria-label="Your Email Address"
              className="bg-elevated border-border focus-visible:ring-accent/50"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={disabled}
            />
            <Button 
              type="submit"
              disabled={disabled}
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
