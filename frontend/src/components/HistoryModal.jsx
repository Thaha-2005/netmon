import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { deviceApi } from '../services/api';

export default function HistoryModal({ device, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await deviceApi.getHistory(device.ip);
        setHistory((data.history || []).slice().reverse());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [device.ip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-xl border shadow-2xl animate-slide-up flex flex-col"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="font-display font-semibold text-terminal-text">
                Device History
              </h2>
              <p className="text-xs font-mono text-terminal-muted mt-0.5">
                {device.name || device.ip} • {device.ip}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-terminal-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <p className="text-sm text-terminal-red font-mono text-center py-8">{error}</p>
          )}
          {!loading && !error && history.length === 0 && (
            <p className="text-sm text-terminal-muted font-mono text-center py-8">
              No history recorded yet. Monitoring will populate this over time.
            </p>
          )}
          {!loading && !error && history.length > 0 && (
            <div className="space-y-1">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg text-xs font-mono"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="text-terminal-muted">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span
                    className={
                      entry.status === 'Online'
                        ? 'text-terminal-green'
                        : 'text-terminal-red'
                    }
                  >
                    {entry.status}
                  </span>
                  <span className="text-terminal-text">
                    {entry.latency != null ? `${entry.latency}ms` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
