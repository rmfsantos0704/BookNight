const mongoose = require('mongoose');
const dns = require('dns');

// Windows + Node can fail to resolve mongodb+srv SRV records even when the
// OS resolver works fine (nslookup succeeds) - Node's own c-ares resolver
// sometimes doesn't pick up the configured adapter DNS correctly. Forcing
// it to use Google's DNS directly sidesteps that.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;