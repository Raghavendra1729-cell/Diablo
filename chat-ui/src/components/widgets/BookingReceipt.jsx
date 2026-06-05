import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingReceipt({ id, date, time, email, meet_url, onAction, disabled }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl glass shadow-lg shadow-black/20 animate-pop-in">
      <div className="bg-gradient-to-r from-success/90 to-success text-slate-900 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
          <Check className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <h3 className="text-[13px] font-bold tracking-wide uppercase">Booking Confirmed</h3>
          <p className="text-[11px] text-slate-900/90 font-medium tracking-wider">ID: {id}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 text-sm w-full">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <span className="text-primary/90 font-medium flex-1 min-w-0">{date}</span>
        </div>
        <div className="flex items-center gap-3 text-sm w-full">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-primary/90 font-medium flex-1 min-w-0">{time}</span>
        </div>
        <div className="flex items-center gap-3 text-sm w-full">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <span className="text-primary/90 font-medium break-all flex-1 min-w-0">{email}</span>
        </div>
        {meet_url && (
          <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/50 mt-3 w-full">
             <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
               <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
               </svg>
             </div>
             <a href={meet_url} target="_blank" rel="noopener noreferrer" aria-label="Join Meeting (opens in a new tab)" className="text-accent hover:text-accent2 font-semibold underline decoration-2 underline-offset-2 transition-colors break-all focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-sm">
               Join Meeting
             </a>
          </div>
        )}
        <div className="flex gap-3 pt-3 border-t border-border/50 mt-3 w-full">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Cancel my meeting for ${date} at ${time}.`)} 
            className="flex-1 text-xs font-bold text-danger border-danger/30 hover:bg-danger/10 hover:text-danger rounded-xl h-9"
          >
            Cancel Meeting
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Reschedule my meeting on ${date} at ${time}.`)} 
            className="flex-1 text-xs font-bold text-accent border-accent/30 hover:bg-accent/10 hover:text-accent rounded-xl h-9"
          >
            Reschedule
          </Button>
        </div>
      </div>
    </div>
  );
}
