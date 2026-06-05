export function StatusDot() {
  return (
    <span className="relative inline-flex w-[10px] h-[10px] align-middle">
      <span className="status-ring bg-success/30" style={{ animationDelay: '0s' }} />
      <span className="status-ring bg-success/20" style={{ animationDelay: '0.8s' }} />
      <span className="relative w-[10px] h-[10px] rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
    </span>
  );
}
