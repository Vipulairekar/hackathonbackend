const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const dotenv = require('dotenv');


dotenv.config();

const app = express();
app.use(bodyParser.json());


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Error connecting to MongoDB:', err));


const eventLogSchema = new mongoose.Schema({
  eventType: String,
  timestamp: String,
  sourceAppId: String,
  dataPayload: Object,
  previousHash: String,
  hash: String
});

const EventLog = mongoose.model('EventLog', eventLogSchema);


function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

let lastHash = null; 


app.post('/log', async (req, res) => {
  const { eventType, timestamp, sourceAppId, dataPayload } = req.body;


  if (!eventType || !timestamp || !sourceAppId || !dataPayload) {
    return res.status(400).json({ error: 'Missing required fields' });
  }


  const eventLog = {
    eventType,
    timestamp,
    sourceAppId,
    dataPayload,
    previousHash: lastHash,
  };


  const logHash = generateHash(eventLog);
  eventLog.hash = logHash;

 
  const log = new EventLog(eventLog);
  await log.save();

  lastHash = logHash; 

  res.status(201).json(eventLog);
});


app.get('/logs', async (req, res) => {
  try {
    const { eventType, startDate, endDate, sourceAppId, page = 1, limit = 10 } = req.query;
    const filters = {};

    
    if (eventType) filters.eventType = eventType;
    if (sourceAppId) filters.sourceAppId = sourceAppId;
    if (startDate && endDate) filters.timestamp = { $gte: startDate, $lte: endDate };

    
    const logs = await EventLog.find(filters)
      .skip((page - 1) * limit)  
      .limit(limit);  

   
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching logs', details: err.message });
  }
});


const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
