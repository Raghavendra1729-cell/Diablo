import { Check, Calendar, Clock, Mail, Video, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingReceipt({ id, date, time, email, meet_url, onAction, disabled }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-xl animate-pop-in">
      {/* Success header */}
      <div className="bg-emerald-950/40 border-b border-emerald-800/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide text-emerald-300 uppercase">
              Interview Confirmed
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">Ref: {id}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
          Synced
        </span>
      </div>

      {/* Detail rows */}
      <div className="p-4 space-y-2.5">
        <DetailRow icon={Calendar} label={date} />
        <DetailRow icon={Clock} label={time} />
        <DetailRow icon={Mail} label={email} />

        {meet_url && (
          <div className="border-t border-zinc-800/80 pt-3 mt-1">
            <a
              href={meet_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Meeting (opens in a new tab)"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              Join Video Meeting
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Cancel my meeting for ${date} at ${time}.`)}
            className="flex-1 text-xs font-medium text-rose-400 border-zinc-800 hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-800/40 rounded-lg h-8"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Reschedule my meeting on ${date} at ${time}.`)}
            className="flex-1 text-xs font-medium text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg h-8"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reschedule
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
      <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="font-medium truncate">{label}</span>
    </div>
  );
}
