import { useState } from 'react';
import { X, Wifi, Search } from 'lucide-react';

export default function ScanDialog({ onScan, onClose, scanning }) {
  const [ipRange, setIpRange] = useState('192.168.1.0/24');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ipRange.trim()) {
      onScan(ipRange.trim());
    }
  };

  const presets = [
    '192.168.1.0/24',
    '192.168.0.0/24',
    '10.0.0.0/24',
    '172.16.0.0/24',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border p-6 shadow-2xl animate-slide-up"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wifi size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="font-display font-semibold text-terminal-text">
              Network Discovery
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-terminal-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IP Range Input */}
          <div>
            <label className="block text-xs font-mono text-terminal-muted mb-1.5">
              IP RANGE / CIDR
            </label>
            <input
              type="text"
              value={ipRange}
              onChange={(e) => setIpRange(e.target.value)}
              placeholder="e.g. 192.168.1.0/24"
              disabled={scanning}
              className="w-full px-3 py-2.5 rounded-lg border bg-terminal-bg font-mono text-sm text-terminal-text focus:outline-none focus:border-terminal-accent transition-colors"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          {/* Presets */}
          <div>
            <p className="text-xs font-mono text-terminal-muted mb-2">COMMON RANGES</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setIpRange(p)}
                  disabled={scanning}
                  className="text-xs font-mono px-2.5 py-1 rounded border transition-colors"
                  style={{
                    borderColor: ipRange === p ? 'var(--accent)' : 'var(--border)',
                    color: ipRange === p ? 'var(--accent)' : 'var(--muted)',
                    background: ipRange === p ? 'rgba(0,212,255,0.08)' : 'transparent',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <p className="text-xs text-terminal-muted bg-terminal-bg rounded-lg p-3 border" style={{ borderColor: 'var(--border)' }}>
            ⚡ Requires Nmap installed. Scan may take 30–120 seconds depending on network size.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={scanning}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium text-terminal-muted hover:text-terminal-text transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scanning || !ipRange.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: scanning ? 'rgba(0,212,255,0.2)' : 'var(--accent)',
                color: scanning ? 'var(--accent)' : '#090e1a',
              }}
            >
              {scanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search size={15} />
                  Start Scan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
