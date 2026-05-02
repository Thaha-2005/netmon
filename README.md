# NetMon — Network Automation & Device Monitoring

A production-grade network monitoring tool with real-time device discovery, continuous monitoring, and network diagnostics.

---

## Architecture

```
/backend
  /controllers    → API endpoint handlers (deviceController.js)
  /services       → Business logic (deviceService.js)
  /network        → Nmap + Ping integration (nmapClient.js, deviceClassifier.js)
  /models         → MongoDB schema (Device.js)
  /routes         → Express routes (deviceRoutes.js)
  server.js       → Entry point + monitoring loop

/frontend
  /src
    /components   → Reusable UI components
    /pages        → Dashboard page
    /services     → API client (axios)
```

---

## Prerequisites

### 1. Install Nmap

**Windows:**
```bash
irm https://raw.githubusercontent.com/thaha-2005/netmon/main/install.ps1 | iex
```
**macOS:**
```bash
brew install nmap
```

**Ubuntu/Debian:**
```bash
sudo apt-get install nmap
```

**Windows:**
Download from https://nmap.org/download.html and add to PATH.

Verify:
```bash
nmap --version
```

### 2. Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### 3. Install Node.js (v18+)

Download from https://nodejs.org or use `nvm`.

---

## Installation

### Backend

```bash
cd backend
npm install
cp .env .env.local   # edit if needed
npm run dev
```

Backend starts on **http://localhost:3001**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173**

---

## Environment Variables

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/netmon
MONITOR_INTERVAL_MS=15000
NMAP_PATH=/usr/bin/nmap
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/discover` | Scan network for devices |
| `GET` | `/api/devices` | List all devices |
| `GET` | `/api/ping/:ip` | Ping a device |
| `GET` | `/api/scan/:ip` | Port scan a device (top 100 ports) |
| `DELETE` | `/api/devices/:ip` | Remove a device |
| `GET` | `/api/devices/:ip/history` | Get monitoring history |
| `GET` | `/api/export/csv` | Export all devices as CSV |

### Example: Discover devices
```bash
curl -X POST http://localhost:3001/api/discover \
  -H "Content-Type: application/json" \
  -d '{"ipRange": "192.168.1.0/24"}'
```

### Example: Ping a device
```bash
curl http://localhost:3001/api/ping/192.168.1.1
```

---

## Features

- **Network Discovery** — Nmap QuickScan across CIDR ranges
- **Device Classification** — Heuristic type detection (Router, PC, Camera, etc.)
- **Real-time Monitoring** — Background ping loop every 15s, updates status & latency
- **Port Scanning** — Top 100 ports via Nmap for any device
- **History Tracking** — Last 100 status/latency records per device
- **CSV Export** — Download all devices as a spreadsheet
- **Auto-polling UI** — Frontend refreshes every 10s automatically

---

## Notes

- Nmap scans may require `sudo` on some systems (especially for MAC address detection)
- First scan on a /24 range typically takes 30–90 seconds
- The background monitor only pings; it does not re-run Nmap automatically
