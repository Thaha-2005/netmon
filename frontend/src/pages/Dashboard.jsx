import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Radar,
  Download,
  Wifi,
  AlertTriangle,
} from 'lucide-react';
import { deviceApi } from '../services/api';
import StatsBar from '../components/StatsBar';
import DeviceTable from '../components/DeviceTable';
import ScanDialog from '../components/ScanDialog';
import HistoryModal from '../components/HistoryModal';
import { useToast } from '../components/Toast';

const POLL_INTERVAL = 10_000; // 10 seconds

export default function Dashboard({ addToast }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [historyDevice, setHistoryDevice] = useState(null);
  const [loadingActions, setLoadingActions] = useState({}); // { [ip]: { ping, scan, delete } }
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  // ── Fetch devices ──────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await deviceApi.getDevices();
      setDevices(data.devices || []);
      setLastUpdated(new Date());
    } catch (err) {
      addToast(`Failed to fetch devices: ${err.message}`, 'error');
    } finally {
      if (!silent) setRefreshing(false);
      setLoading(false);
    }
  }, [addToast]);

  // ── Initial load + polling ─────────────────────────────────────────────────
  useEffect(() => {
    fetchDevices();

    pollRef.current = setInterval(() => {
      fetchDevices(true); // silent polling
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [fetchDevices]);

  // ── Discovery scan ─────────────────────────────────────────────────────────
  const handleScan = async (ipRange) => {
    setScanning(true);
    try {
      const data = await deviceApi.discover(ipRange);
      addToast(data.message, 'success');
      await fetchDevices(true);
      setShowScanDialog(false);
    } catch (err) {
      addToast(`Scan failed: ${err.message}`, 'error');
    } finally {
      setScanning(false);
    }
  };

  // ── Per-device actions ─────────────────────────────────────────────────────
  const setDeviceBusy = (ip, key, val) =>
    setLoadingActions((prev) => ({
      ...prev,
      [ip]: { ...prev[ip], [key]: val },
    }));

  const handlePing = async (ip) => {
    setDeviceBusy(ip, 'ping', true);
    try {
      const data = await deviceApi.ping(ip);
      const msg = data.alive
        ? `${ip} is online — ${data.latency?.toFixed(1) ?? '?'}ms`
        : `${ip} is unreachable`;
      addToast(msg, data.alive ? 'success' : 'error');
      // Update local state immediately
      setDevices((prev) =>
        prev.map((d) =>
          d.ip === ip
            ? { ...d, status: data.alive ? 'Online' : 'Offline', latency: data.latency }
            : d
        )
      );
    } catch (err) {
      addToast(`Ping failed: ${err.message}`, 'error');
    } finally {
      setDeviceBusy(ip, 'ping', false);
    }
  };

  const handleScanPorts = async (ip) => {
    setDeviceBusy(ip, 'scan', true);
    addToast(`Scanning ports on ${ip}…`, 'info');
    try {
      const data = await deviceApi.scan(ip);
      const portList = data.openPorts?.join(', ') || 'none';
      addToast(
        `${ip}: ${data.count} open port(s) — ${portList}`,
        data.count > 0 ? 'success' : 'info'
      );
      setDevices((prev) =>
        prev.map((d) =>
          d.ip === ip ? { ...d, openPorts: data.openPorts } : d
        )
      );
    } catch (err) {
      addToast(`Port scan failed: ${err.message}`, 'error');
    } finally {
      setDeviceBusy(ip, 'scan', false);
    }
  };

  const handleDelete = async (ip) => {
    if (!confirm(`Remove ${ip} from the device list?`)) return;
    setDeviceBusy(ip, 'delete', true);
    try {
      await deviceApi.deleteDevice(ip);
      setDevices((prev) => prev.filter((d) => d.ip !== ip));
      addToast(`Device ${ip} removed.`, 'info');
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeviceBusy(ip, 'delete', false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.15)' }}
            >
              <Radar size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h1
              className="font-display font-bold text-2xl tracking-tight"
              style={{ color: 'var(--accent)' }}
            >
              NETMON
            </h1>
          </div>
          <p className="text-sm text-terminal-muted ml-11">
            Network Automation & Device Monitoring
            {lastUpdated && (
              <span className="ml-2 font-mono text-xs">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <a
            href={deviceApi.exportCsvUrl()}
            download="devices.csv"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium text-terminal-muted hover:text-terminal-text transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <Download size={14} />
            Export CSV
          </a>

          {/* Refresh */}
          <button
            onClick={() => fetchDevices()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium text-terminal-muted hover:text-terminal-text transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          {/* Scan Network */}
          <button
            onClick={() => setShowScanDialog(true)}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'var(--accent)',
              color: '#090e1a',
            }}
          >
            <Wifi size={14} />
            {scanning ? 'Scanning...' : 'Scan Network'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar devices={devices} />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-terminal-muted font-mono">
              Connecting to backend…
            </p>
          </div>
        </div>
      )}

      {/* Device Table */}
      {!loading && (
        <DeviceTable
          devices={devices}
          loadingActions={loadingActions}
          onPing={handlePing}
          onScan={handleScanPorts}
          onDelete={handleDelete}
          onHistory={setHistoryDevice}
        />
      )}

      {/* Polling indicator */}
      <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted">
        <div className="w-1.5 h-1.5 rounded-full bg-terminal-green status-dot-online" />
        Auto-refreshing every {POLL_INTERVAL / 1000}s
      </div>

      {/* Dialogs */}
      {showScanDialog && (
        <ScanDialog
          scanning={scanning}
          onScan={handleScan}
          onClose={() => setShowScanDialog(false)}
        />
      )}
      {historyDevice && (
        <HistoryModal
          device={historyDevice}
          onClose={() => setHistoryDevice(null)}
        />
      )}
    </div>
  );
}
