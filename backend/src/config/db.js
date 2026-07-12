const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sivakumar:Siva123@cluster0.oidufho.mongodb.net/?appName=Cluster0');
    console.log(`MongoDB Connected successFully.. ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n======================================================`);
    console.error(`WARNING: MongoDB Connection Failed: ${error.message}`);
    console.error(`Please configure MONGO_URI in .env with a valid MongoDB Atlas connection string.`);
    console.error(`======================================================\n`);
  }
};

module.exports = connectDB;
