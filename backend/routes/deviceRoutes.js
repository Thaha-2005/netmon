const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deviceController');

// Network discovery
router.post('/discover', ctrl.discoverDevices);

// Device CRUD
router.get('/devices', ctrl.getAllDevices);
router.delete('/devices/:ip', ctrl.deleteDevice);
router.get('/devices/:ip/history', ctrl.getDeviceHistory);

// Network tools
router.get('/ping/:ip', ctrl.pingDevice);
router.get('/scan/:ip', ctrl.scanDevice);

// Export
router.get('/export/csv', ctrl.exportCsv);

module.exports = router;
