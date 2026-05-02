export default function StatusBadge({ status }) {
  const isOnline = status === 'Online';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-terminal-green status-dot-online' : 'bg-terminal-red'
        }`}
      />
      <span
        className={`text-xs font-mono font-medium ${
          isOnline ? 'text-terminal-green' : 'text-terminal-red'
        }`}
      >
        {status}
      </span>
    </span>
  );
}
