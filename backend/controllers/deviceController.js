const deviceService = require('../services/deviceService');

/**
 * POST /api/discover
 * Body: { ipRange: "192.168.1.0/24" }
 */
async function discoverDevices(req, res) {
  try {
    const { ipRange } = req.body;

    if (!ipRange) {
      return res.status(400).json({ error: 'ipRange is required in request body.' });
    }

    console.log(`[Discover] Starting scan on: ${ipRange}`);
    const devices = await deviceService.discoverDevices(ipRange);

    return res.json({
      success: true,
      message: `Discovery complete. Found ${devices.length} device(s).`,
      count: devices.length,
      devices,
    });
  } catch (err) {
    console.error('[Discover] Error:', err.message);

    if (err.message.includes('Nmap is not installed')) {
      return res.status(503).json({ error: err.message });
    }

    if (err.message.includes('timed out')) {
      return res.status(504).json({ error: 'Scan timed out. Try a smaller IP range.' });
    }

    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/devices
 */
async function getAllDevices(req, res) {
  try {
    const devices = await deviceService.getAllDevices();
    return res.json({ success: true, count: devices.length, devices });
  } catch (err) {
    console.error('[Devices] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/ping/:ip
 */
async function pingDevice(req, res) {
  try {
    const { ip } = req.params;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required.' });
    }

    const result = await deviceService.pingDevice(ip);

    return res.json({
      success: true,
      ip,
      alive: result.alive,
      latency: result.latency,
    });
  } catch (err) {
    console.error(`[Ping] Error for ${req.params.ip}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/scan/:ip
 */
async function scanDevice(req, res) {
  try {
    const { ip } = req.params;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required.' });
    }

    console.log(`[Scan] Scanning ports on: ${ip}`);
    const openPorts = await deviceService.scanDevicePorts(ip);

    return res.json({
      success: true,
      ip,
      openPorts,
      count: openPorts.length,
    });
  } catch (err) {
    console.error(`[Scan] Error for ${req.params.ip}:`, err.message);

    if (err.message.includes('Nmap is not installed')) {
      return res.status(503).json({ error: err.message });
    }

    if (err.message.includes('timed out')) {
      return res.status(504).json({ error: 'Port scan timed out.' });
    }

    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/devices/:ip
 */
async function deleteDevice(req, res) {
  try {
    const { ip } = req.params;
    const Device = require('../models/Device');
    await Device.deleteOne({ ip });
    return res.json({ success: true, message: `Device ${ip} removed.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/devices/:ip/history
 */
async function getDeviceHistory(req, res) {
  try {
    const { ip } = req.params;
    const Device = require('../models/Device');
    const device = await Device.findOne({ ip }).select('history ip name').lean();

    if (!device) {
      return res.status(404).json({ error: 'Device not found.' });
    }

    return res.json({ success: true, ip, history: device.history || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/export/csv
 */
async function exportCsv(req, res) {
  try {
    const devices = await deviceService.getAllDevices();

    const headers = ['IP,Name,Type,MAC,Vendor,Status,Latency(ms),OpenPorts,LastSeen'];
    const rows = devices.map((d) => [
      d.ip,
      `"${d.name || ''}"`,
      d.type,
      d.mac || '',
      `"${d.vendor || ''}"`,
      d.status,
      d.latency != null ? d.latency : '',
      `"${(d.openPorts || []).join(';')}"`,
      d.lastSeen ? new Date(d.lastSeen).toISOString() : '',
    ].join(','));

    const csv = [...headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="devices.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  discoverDevices,
  getAllDevices,
  pingDevice,
  scanDevice,
  deleteDevice,
  getDeviceHistory,
  exportCsv,
};
