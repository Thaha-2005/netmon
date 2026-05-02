const nmap = require('node-nmap');
const ping = require('ping');

nmap.nmapLocation = process.env.NMAP_PATH || 'nmap';

/**
 * Checks if Nmap is installed and accessible.
 */
async function checkNmapAvailable() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('nmap --version', (err) => {
      resolve(!err);
    });
  });
}

/**
 * Runs an Nmap QuickScan (-sn -T4) on the given IP range.
 * Returns an array of discovered host objects.
 */
function nmapQuickScan(ipRange) {
  return new Promise((resolve, reject) => {
    const quickscan = new nmap.QuickScan(ipRange);

    const timeout = setTimeout(() => {
      reject(new Error('Nmap scan timed out after 120 seconds'));
    }, 120000);

    quickscan.on('complete', (data) => {
      clearTimeout(timeout);
      resolve(data || []);
    });

    quickscan.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Nmap scan error: ${err}`));
    });

    quickscan.startScan();
  });
}

/**
 * Runs an Nmap port scan on a single IP (top 100 ports).
 * Returns list of open port numbers.
 */
function nmapPortScan(ip) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    // --top-ports 100 gives us the 100 most common ports
    const cmd = `nmap -T4 --top-ports 100 --open -oG - ${ip}`;

    const timeout = setTimeout(() => {
      reject(new Error('Port scan timed out'));
    }, 60000);

    exec(cmd, (err, stdout, stderr) => {
      clearTimeout(timeout);

      if (err && !stdout) {
        return reject(new Error(`Port scan failed: ${err.message}`));
      }

      const openPorts = [];
      const portRegex = /(\d+)\/open/g;
      let match;
      while ((match = portRegex.exec(stdout)) !== null) {
        openPorts.push(parseInt(match[1], 10));
      }

      resolve(openPorts);
    });
  });
}

/**
 * Pings a single IP and returns latency in ms (or null if unreachable).
 */
async function pingHost(ip) {
  try {
    const res = await ping.promise.probe(ip, {
      timeout: 5,
      extra: ['-c', '3'],
    });

    if (!res.alive) return { alive: false, latency: null };

    const latency = parseFloat(res.avg) || null;
    return { alive: true, latency };
  } catch (err) {
    return { alive: false, latency: null };
  }
}

module.exports = {
  checkNmapAvailable,
  nmapQuickScan,
  nmapPortScan,
  pingHost,
};
