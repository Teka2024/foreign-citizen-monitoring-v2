const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foreign_citizen_db');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✅ Admin user already exists:');
      console.log(`📌 Username: ${adminExists.username}`);
      console.log(`📌 Email: ${adminExists.email}`);
      console.log(`📌 Role: ${adminExists.role}`);
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      fullName: 'System Administrator',
      username: 'admin',
      email: 'admin@system.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      department: 'administration'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📌 Username: admin');
    console.log('📌 Password: admin123');
    console.log('📌 Email: admin@system.com');
    console.log('📌 Role: admin');
    console.log('✅ You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();