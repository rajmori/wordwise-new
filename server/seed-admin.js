import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connected');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@wordwise.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('Email:', existingAdmin.email);

            // Force reset password
            existingAdmin.password = 'admin123';
            await existingAdmin.save();
            console.log('✅ Password reset to: admin123');
        } else {
            // Create default admin user
            const admin = new Admin({
                email: 'admin@wordwise.com',
                password: 'admin123', // Will be hashed automatically by the model
                name: 'WordWise Admin',
                role: 'super_admin',
                isActive: true
            });

            await admin.save();

            console.log('✅ Default admin user created successfully!');
            console.log('\n📧 Login Credentials:');
            console.log('Email: admin@wordwise.com');
            console.log('Password: admin123');
            console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        }

        // Check/Create Test Admin
        const testAdmin = await Admin.findOne({ email: 'testadmin@wordwise.com' });
        if (!testAdmin) {
            const admin = new Admin({
                email: 'testadmin@wordwise.com',
                password: 'admin123',
                name: 'Test Admin',
                role: 'super_admin',
                isActive: true
            });
            await admin.save();
            console.log('✅ Test admin user created: testadmin@wordwise.com');
        } else {
            testAdmin.password = 'admin123';
            await testAdmin.save();
            console.log('✅ Test admin password reset: testadmin@wordwise.com');
        }

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

// Run the seed function
seedAdmin();

