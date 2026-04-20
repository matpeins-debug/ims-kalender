// DEBUG-VERSION: minimaler Router zum Isolieren des Vercel-Crashes

const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
  res.json({
    success: true,
    data: [],
    error: null,
    _debug: 'minimal-router-ok'
  });
});

module.exports = router;
