const COLORS = {
  checking: 'bg-amber-400',
  degraded: 'bg-amber-400',
  offline: 'bg-danger',
  online: 'bg-success',
};

export function StatusDot({ status = 'online' }) {
  const color = COLORS[status] || COLORS.checking;
  return (
    <span className="relative inline-flex w-[10px] h-[10px] align-middle">
      <span className={`status-ring ${color} opacity-30`} style={{ animationDelay: '0s' }} />
      <span className={`relative w-[10px] h-[10px] rounded-full ${color} shadow-sm`} />
    </span>
  );
}
