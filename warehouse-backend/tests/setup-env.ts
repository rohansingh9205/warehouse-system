// Populates the env vars required by src/common/config/env.ts so tests can
// import the app without needing a real .env file. MONGODB_URI is
// overridden per-test by mongodb-memory-server's connection string; the
// placeholder here only needs to pass schema validation at import time.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/silk_warehouse_test";
process.env.SESSION_SECRET = "test_session_secret_please_ignore";
process.env.OTP_SECRET = "test_otp_secret_please_ignore_value";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";
process.env.INTEGRATION_SECRET = "test_integration_secret_ignore_val";
process.env.COOKIE_SECURE = "false";
