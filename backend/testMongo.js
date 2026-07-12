require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, { autoIndex: false });
    console.log('MongoDB connected successfully');
    console.log('Host:', mongoose.connection.host);
    console.log('Name:', mongoose.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:');
    console.error(err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
