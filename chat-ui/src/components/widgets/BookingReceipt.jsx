import { Check, Calendar, Clock, Mail, Video, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingReceipt({ id, date, time, email, meet_url, onAction, disabled }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] animate-pop-in text-black">
      {/* Success header */}
      <div className="bg-[#4ade80] border-b-2 border-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wide uppercase text-black">
              Interview Confirmed
            </h3>
            <p className="text-[11px] font-mono font-bold text-black mt-0.5">Ref: {id}</p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-white border border-black shadow-[1px_1px_0px_0px_#000]">
          Synced
        </span>
      </div>

      {/* Detail rows */}
      <div className="p-4 space-y-2.5">
        <DetailRow icon={Calendar} label={date} />
        <DetailRow icon={Clock} label={time} />
        <DetailRow icon={Mail} label={email} />

        {meet_url && (
          <div className="border-t-2 border-black pt-3 mt-1">
            <a
              href={meet_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Video Meeting (opens in a new tab)"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-xs font-extrabold text-black bg-[#ffde59] hover:bg-[#ffe580] border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <Video className="w-4 h-4" />
              Join Video Meeting
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t-2 border-black">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Cancel my meeting for ${date} at ${time}.`)}
            className="flex-1 text-xs font-bold text-black bg-[#fee2e2] hover:bg-red-200 border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-lg h-8 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 mr-1 text-red-600" />
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onAction && onAction(`Reschedule my meeting on ${date} at ${time}.`)}
            className="flex-1 text-xs font-bold text-black bg-white hover:bg-zinc-100 border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-lg h-8 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Reschedule
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-black">
      <div className="w-6 h-6 rounded-md bg-[#ffde59] border-1.5 border-black flex items-center justify-center shrink-0 text-black shadow-[1px_1px_0px_0px_#000]">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="font-bold truncate">{label}</span>
    </div>
  );
}
