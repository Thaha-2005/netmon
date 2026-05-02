/**
 * Heuristic-based device type classifier.
 * Uses open ports, vendor strings, and hostname patterns.
 */

// Known vendor → device type mappings (partial MAC OUI vendors)
const VENDOR_TYPE_MAP = {
  // Networking
  cisco: 'Router',
  juniper: 'Router',
  mikrotik: 'Router',
  ubiquiti: 'Router',
  netgear: 'Router',
  'tp-link': 'Router',
  asus: 'Router',
  linksys: 'Router',
  dlink: 'Router',

  // Cameras / IoT
  hikvision: 'Camera',
  dahua: 'Camera',
  axis: 'Camera',
  foscam: 'Camera',
  reolink: 'Camera',

  // Computers / Laptops
  apple: 'Laptop',
  'intel corporate': 'PC',
  dell: 'PC',
  lenovo: 'Laptop',
  hp: 'PC',
  hewlett: 'PC',
  samsung: 'Phone',

  // Printers
  brother: 'Printer',
  epson: 'Printer',
  canon: 'Printer',
  ricoh: 'Printer',

  // Servers
  supermicro: 'Server',
  'vmware, inc.': 'Server',
};

// Port → device type signals
const PORT_TYPE_SIGNALS = {
  80: ['Router', 'Server', 'Camera'],   // HTTP
  443: ['Router', 'Server'],            // HTTPS
  8080: ['Router', 'Camera'],           // Alt HTTP
  554: ['Camera'],                      // RTSP (video stream)
  8554: ['Camera'],                     // RTSP alt
  22: ['Server', 'Router'],             // SSH
  21: ['Server'],                       // FTP
  23: ['Router'],                       // Telnet (old routers)
  3389: ['PC', 'Server'],               // RDP
  445: ['PC', 'Server'],                // SMB
  139: ['PC'],                          // NetBIOS
  515: ['Printer'],                     // LPD print
  631: ['Printer'],                     // IPP (CUPS)
  9100: ['Printer'],                    // Raw print
};

/**
 * Classify a device based on available heuristics.
 * @param {Object} params - { vendor, openPorts, hostname }
 * @returns {string} Device type
 */
function classifyDevice({ vendor = '', openPorts = [], hostname = '' }) {
  const vendorLower = vendor.toLowerCase();
  const hostLower = (hostname || '').toLowerCase();

  // 1. Vendor exact/partial match
  for (const [key, type] of Object.entries(VENDOR_TYPE_MAP)) {
    if (vendorLower.includes(key)) return type;
  }

  // 2. Hostname pattern matching
  if (/router|gateway|gw\d|ap\d/i.test(hostLower)) return 'Router';
  if (/cam|ipcam|nvr|dvr/i.test(hostLower)) return 'Camera';
  if (/printer|print|mfp/i.test(hostLower)) return 'Printer';
  if (/server|srv|nas|storage/i.test(hostLower)) return 'Server';
  if (/iphone|android|phone|mobile/i.test(hostLower)) return 'Phone';
  if (/laptop|notebook/i.test(hostLower)) return 'Laptop';

  // 3. Port-based scoring
  const scores = {};

  for (const port of openPorts) {
    const types = PORT_TYPE_SIGNALS[port];
    if (!types) continue;
    for (const t of types) {
      scores[t] = (scores[t] || 0) + 1;
    }
  }

  if (Object.keys(scores).length > 0) {
    const topType = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return topType;
  }

  return 'Unknown';
}

module.exports = { classifyDevice };
