const express = require('express');
const Log = require('../models/Log');
const { generateHash } = require('../utils/hashUtil');
const router = express.Router();

router.post('/log', async (req, res) => {
  const { eventType, timestamp, sourceAppId, dataPayload } = req.body;

  try {
    const latestLog = await Log.findOne().sort({ timestamp: -1 });
    const previousHash = latestLog ? latestLog.currentHash : null;

    const logData = { eventType, timestamp, sourceAppId, dataPayload };
    const currentHash = generateHash(JSON.stringify(logData) + previousHash);

    const newLog = new Log({ ...logData, currentHash, previousHash });
    await newLog.save();

    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log event' });
  }
});

module.exports = router;
