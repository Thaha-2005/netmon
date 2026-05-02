import { Monitor, Wifi, WifiOff, Activity } from 'lucide-react';

export default function StatsBar({ devices }) {
  const total = devices.length;
  const online = devices.filter((d) => d.status === 'Online').length;
  const offline = total - online;
  const avgLatency =
    devices.filter((d) => d.latency != null).length > 0
      ? Math.round(
          devices.reduce((s, d) => s + (d.latency || 0), 0) /
            devices.filter((d) => d.latency != null).length
        )
      : null;

  const stats = [
    {
      icon: <Monitor size={14} />,
      label: 'Total Devices',
      value: total,
      color: 'var(--accent)',
    },
    {
      icon: <Wifi size={14} />,
      label: 'Online',
      value: online,
      color: 'var(--green)',
    },
    {
      icon: <WifiOff size={14} />,
      label: 'Offline',
      value: offline,
      color: 'var(--red)',
    },
    {
      icon: <Activity size={14} />,
      label: 'Avg Latency',
      value: avgLatency != null ? `${avgLatency}ms` : '—',
      color: 'var(--amber)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border p-4 flex items-center gap-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              color: s.color,
              background: `${s.color}15`,
            }}
          >
            {s.icon}
          </span>
          <div>
            <p
              className="font-mono font-semibold text-lg leading-none"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-xs text-terminal-muted mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
