const Device = require('../models/Device');
const { nmapQuickScan, nmapPortScan, pingHost, checkNmapAvailable } = require('../network/nmapClient');
const { classifyDevice } = require('../network/deviceClassifier');

/**
 * Validates an IP range / CIDR format (basic check).
 */
function isValidIpRange(range) {
  // Allow: 192.168.1.0/24, 10.0.0.1-254, 192.168.1.1
  return /^[\d.\/\-\*]+$/.test(range.trim());
}

/**
 * Runs a network discovery scan and upserts results into MongoDB.
 */
async function discoverDevices(ipRange) {
  if (!isValidIpRange(ipRange)) {
    throw new Error(`Invalid IP range: "${ipRange}"`);
  }

  const nmapAvailable = await checkNmapAvailable();
  if (!nmapAvailable) {
    throw new Error(
      'Nmap is not installed or not in PATH. Please install nmap first.'
    );
  }

  const hosts = await nmapQuickScan(ipRange);

  const results = [];

  for (const host of hosts) {
    if (!host.ip) continue;

    const ip = host.ip;
    const hostname = host.hostname || '';
    const mac = host.mac || '';
    const vendor = host.vendor || '';
    const openPorts = (host.openPorts || []).map((p) =>
      typeof p === 'object' ? parseInt(p.port, 10) : parseInt(p, 10)
    ).filter(Boolean);

    const type = classifyDevice({ vendor, openPorts, hostname });

    const device = await Device.findOneAndUpdate(
      { ip },
      {
        $set: {
          ip,
          name: hostname || ip,
          mac,
          vendor,
          type,
          status: 'Online',
          lastSeen: new Date(),
          openPorts,
        },
      },
      { upsert: true, new: true }
    );

    results.push(device);
  }

  return results;
}

/**
 * Returns all devices from the database.
 */
async function getAllDevices() {
  return Device.find().sort({ lastSeen: -1 }).lean();
}

/**
 * Pings a single device and returns latency.
 */
async function pingDevice(ip) {
  const result = await pingHost(ip);

  // Update device record if it exists
  await Device.findOneAndUpdate(
    { ip },
    {
      $set: {
        status: result.alive ? 'Online' : 'Offline',
        latency: result.latency,
        lastSeen: result.alive ? new Date() : undefined,
      },
    }
  );

  return result;
}

/**
 * Scans open ports on a device.
 */
async function scanDevicePorts(ip) {
  const nmapAvailable = await checkNmapAvailable();
  if (!nmapAvailable) {
    throw new Error('Nmap is not installed or not in PATH.');
  }

  const openPorts = await nmapPortScan(ip);

  // Update device type based on new port data
  const device = await Device.findOne({ ip });
  if (device) {
    const type = classifyDevice({
      vendor: device.vendor,
      openPorts,
      hostname: device.name,
    });
    await Device.findOneAndUpdate({ ip }, { $set: { openPorts, type } });
  }

  return openPorts;
}

/**
 * Background monitoring worker: pings all known devices and updates status.
 */
async function runMonitoringCycle() {
  const devices = await Device.find().select('ip').lean();

  const promises = devices.map(async ({ ip }) => {
    try {
      const { alive, latency } = await pingHost(ip);

      const update = {
        status: alive ? 'Online' : 'Offline',
        latency: latency,
      };

      if (alive) {
        update.lastSeen = new Date();
      }

      await Device.findOneAndUpdate({ ip }, { $set: update });

      // Store history entry (keep last 100 per device)
      await Device.findOneAndUpdate(
        { ip },
        {
          $push: {
            history: {
              $each: [{ timestamp: new Date(), status: update.status, latency }],
              $slice: -100,
            },
          },
        }
      );
    } catch (err) {
      console.error(`[Monitor] Error pinging ${ip}:`, err.message);
    }
  });

  await Promise.allSettled(promises);
  console.log(`[Monitor] Cycle complete. Checked ${devices.length} devices.`);
}

module.exports = {
  discoverDevices,
  getAllDevices,
  pingDevice,
  scanDevicePorts,
  runMonitoringCycle,
};
