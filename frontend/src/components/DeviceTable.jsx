import { useState } from 'react';
import {
  Activity,
  Search,
  Trash2,
  History,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import DeviceIcon from './DeviceIcon';
import StatusBadge from './StatusBadge';

function PortBadges({ ports }) {
  if (!ports || ports.length === 0) return <span className="text-terminal-muted text-xs">—</span>;

  const shown = ports.slice(0, 5);
  const rest = ports.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((p) => (
        <span key={p} className="port-badge">{p}</span>
      ))}
      {rest > 0 && (
        <span className="port-badge" style={{ color: 'var(--muted)' }}>+{rest}</span>
      )}
    </div>
  );
}

function LatencyBar({ latency }) {
  if (latency == null) return <span className="text-terminal-muted text-xs font-mono">—</span>;

  let color = 'var(--green)';
  if (latency > 100) color = 'var(--amber)';
  if (latency > 500) color = 'var(--red)';

  return (
    <span className="font-mono text-xs" style={{ color }}>
      {latency.toFixed(1)}ms
    </span>
  );
}

const SORT_KEYS = ['ip', 'name', 'type', 'status', 'latency', 'lastSeen'];

export default function DeviceTable({
  devices,
  loadingActions,
  onPing,
  onScan,
  onDelete,
  onHistory,
}) {
  const [sortKey, setSortKey] = useState('lastSeen');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState('');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = devices.filter((d) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      d.ip?.toLowerCase().includes(q) ||
      d.name?.toLowerCase().includes(q) ||
      d.type?.toLowerCase().includes(q) ||
      d.vendor?.toLowerCase().includes(q) ||
      d.mac?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey];
    let bv = b[sortKey];

    if (sortKey === 'lastSeen') {
      av = new Date(av || 0).getTime();
      bv = new Date(bv || 0).getTime();
    }
    if (sortKey === 'latency') {
      av = av ?? Infinity;
      bv = bv ?? Infinity;
    }
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();

    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  function SortIcon({ col }) {
    if (sortKey !== col)
      return <ChevronUp size={12} className="opacity-20" />;
    return sortAsc ? (
      <ChevronUp size={12} style={{ color: 'var(--accent)' }} />
    ) : (
      <ChevronDown size={12} style={{ color: 'var(--accent)' }} />
    );
  }

  function Th({ col, label }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-mono text-terminal-muted uppercase tracking-wider cursor-pointer select-none hover:text-terminal-text transition-colors"
        onClick={() => handleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Filter bar */}
      <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted"
          />
          <input
            type="text"
            placeholder="Filter devices..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border bg-terminal-bg font-mono text-xs text-terminal-text focus:outline-none focus:border-terminal-accent transition-colors"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>
        <span className="text-xs font-mono text-terminal-muted">
          {sorted.length} of {devices.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
              <th className="px-4 py-3 text-left text-xs font-mono text-terminal-muted uppercase tracking-wider w-10">
                Type
              </th>
              <Th col="ip" label="IP Address" />
              <Th col="name" label="Hostname" />
              <th className="px-4 py-3 text-left text-xs font-mono text-terminal-muted uppercase tracking-wider">
                MAC / Vendor
              </th>
              <Th col="type" label="Device Type" />
              <Th col="status" label="Status" />
              <Th col="latency" label="Latency" />
              <th className="px-4 py-3 text-left text-xs font-mono text-terminal-muted uppercase tracking-wider">
                Open Ports
              </th>
              <Th col="lastSeen" label="Last Seen" />
              <th className="px-4 py-3 text-right text-xs font-mono text-terminal-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-16 text-center text-terminal-muted font-mono text-sm"
                >
                  {devices.length === 0
                    ? 'No devices discovered yet. Run a network scan to get started.'
                    : 'No devices match your filter.'}
                </td>
              </tr>
            )}
            {sorted.map((device) => {
              const busy = loadingActions[device.ip] || {};
              return (
                <tr
                  key={device.ip}
                  className="device-row border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* Type Icon */}
                  <td className="px-4 py-3">
                    <DeviceIcon type={device.type} size={16} />
                  </td>

                  {/* IP */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-terminal-accent">
                      {device.ip}
                    </span>
                  </td>

                  {/* Hostname */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-terminal-text truncate max-w-[160px] block">
                      {device.name || '—'}
                    </span>
                  </td>

                  {/* MAC / Vendor */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono text-xs text-terminal-muted">
                        {device.mac || '—'}
                      </p>
                      {device.vendor && (
                        <p className="text-xs text-terminal-text truncate max-w-[120px]">
                          {device.vendor}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Device Type */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-terminal-text">
                      {device.type}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={device.status} />
                  </td>

                  {/* Latency */}
                  <td className="px-4 py-3">
                    <LatencyBar latency={device.latency} />
                  </td>

                  {/* Open Ports */}
                  <td className="px-4 py-3 max-w-[160px]">
                    <PortBadges ports={device.openPorts} />
                  </td>

                  {/* Last Seen */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-terminal-muted whitespace-nowrap">
                      {device.lastSeen
                        ? new Date(device.lastSeen).toLocaleTimeString()
                        : '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionBtn
                        title="Ping"
                        loading={busy.ping}
                        onClick={() => onPing(device.ip)}
                        color="var(--green)"
                      >
                        <Activity size={13} />
                      </ActionBtn>
                      <ActionBtn
                        title="Port Scan"
                        loading={busy.scan}
                        onClick={() => onScan(device.ip)}
                        color="var(--accent)"
                      >
                        <Search size={13} />
                      </ActionBtn>
                      <ActionBtn
                        title="History"
                        loading={false}
                        onClick={() => onHistory(device)}
                        color="var(--amber)"
                      >
                        <History size={13} />
                      </ActionBtn>
                      <ActionBtn
                        title="Delete"
                        loading={busy.delete}
                        onClick={() => onDelete(device.ip)}
                        color="var(--red)"
                      >
                        <Trash2 size={13} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ title, loading, onClick, color, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      className="w-7 h-7 rounded-md flex items-center justify-center border transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        borderColor: `${color}30`,
        color,
        background: `${color}08`,
      }}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : children}
    </button>
  );
}
