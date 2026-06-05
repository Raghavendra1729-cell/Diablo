import { Check, Calendar, Clock, Mail, Video, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingReceipt({ id, date, time, email, meet_url, onAction, disabled }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl glass shadow-sm animate-pop-in">
      {/* Success header */}
      <div className="bg-gradient-to-r from-success to-emerald-500 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-[13px] font-bold tracking-wide uppercase text-white">Booking Confirmed</h3>
          <p className="text-[11px] text-white/80 font-medium tracking-wider mt-0.5">ID: {id}</p>
        </div>
      </div>

      {/* Detail rows */}
      <div className="p-5 space-y-3">
        <DetailRow icon={Calendar} label={date} />
        <DetailRow icon={Clock} label={time} />
        <DetailRow icon={Mail} label={email} />

        {meet_url && (
          <>
            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-3 text-sm w-full">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-accent" />
                </div>
                <a
                  href={meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join Meeting (opens in a new tab)"
                  className="text-accent hover:text-accent2 font-semibold underline decoration-2 underline-offset-2 transition-colors break-all focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-sm"
                >
                  Join Meeting
                </a>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-3 border-t border-border">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Cancel my meeting for ${date} at ${time}.`)}
            className="flex-1 text-xs font-semibold text-danger border-danger/30 hover:bg-danger/5 hover:text-danger hover:border-danger/50 rounded-xl h-9"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Reschedule my meeting on ${date} at ${time}.`)}
            className="flex-1 text-xs font-semibold text-accent border-accent/30 hover:bg-accent/5 hover:text-accent hover:border-accent/50 rounded-xl h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reschedule
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 text-sm w-full">
      <div className="w-8 h-8 rounded-full bg-accent/8 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <span className="text-primary font-medium flex-1 min-w-0 break-all">{label}</span>
    </div>
  );
}
