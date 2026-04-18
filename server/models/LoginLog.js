import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String,
    required: true
  },
  location: {
    country: String,
    city: String,
    isp: String
  },
  device: {
    os: String,
    browser: String,
    platform: String
  },
  loginMethod: {
    type: String, // "form" | "google"
    required: true
  }
});

// Create index for efficient querying by admin
loginLogSchema.index({ timestamp: -1 });
loginLogSchema.index({ userId: 1 });

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

export default LoginLog;
