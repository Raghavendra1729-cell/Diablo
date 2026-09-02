export function StatusDot({ status = 'online' }) {
  const isOnline = status === 'online' || status === 'degraded';
  return (
    <span 
      className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full border-[1.5px] border-black ${
        isOnline ? 'bg-[#4ade80]' : 'bg-[#ef4444]'
      }`} 
      aria-hidden="true"
    />
  );
}
