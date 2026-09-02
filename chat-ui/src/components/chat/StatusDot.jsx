const STATUS_CONFIG = {
  online: { color: 'bg-emerald-400', ping: 'bg-emerald-400/40' },
  checking: { color: 'bg-amber-400', ping: 'bg-amber-400/40' },
  degraded: { color: 'bg-amber-400', ping: 'bg-amber-400/40' },
  offline: { color: 'bg-rose-500', ping: 'bg-rose-500/40' },
};

export function StatusDot({ status = 'online' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checking;
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      <span className={`absolute inline-flex w-full h-full rounded-full animate-ping opacity-60 ${config.ping}`} />
      <span className={`relative inline-flex w-2 h-2 rounded-full ${config.color}`} />
    </span>
  );
}
