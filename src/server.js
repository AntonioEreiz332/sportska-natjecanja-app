require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDriver, closeDriver } = require('./db/neo4j');
const timRoutes = require('./routes/tim');
const igracRoutes = require('./routes/igrac');
const utakmicaRoutes = require('./routes/utakmica');
const ligaRoutes = require('./routes/liga');
const sezonaRoutes = require('./routes/sezona');



const app = express();

app.use(cors());
app.use(express.json());

initDriver();

app.use('/api/tim', timRoutes);
app.use('/api/igrac', igracRoutes);
app.use('/api/utakmica', utakmicaRoutes);
app.use('/api/liga', ligaRoutes);
app.use('/api/sezona', sezonaRoutes);




app.get('/', (req, res) => {
  res.json({ 
    message: 'Sportska natjecanja API - Tim B', 
    version: '1.0.0',
    endpoints: {
      timovi: '/api/tim'
    }
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});

async function shutdown() {
  console.log('\nGašenje servera...');
  await closeDriver();
  server.close(() => {
    console.log('Server zatvoren');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);