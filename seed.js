const dotenv = require('dotenv');
dotenv.config();

// Initialize DynamoDB
require('./src/config/dynamodb');

const User = require('./src/models/User');
console.log('User model path:', require.resolve('./src/models/User'));
const Student = require('./src/models/Student');
const Company = require('./src/models/Company');

const seedData = async () => {
    try {
        console.log('🌱 Seed script started...');
        console.log('User Model Keys:', Object.keys(User));
        console.log('User.createWithHash exists?', typeof User.createWithHash);

        console.log('⏳ Waiting for DynamoDB tables to be created...');

        // Wait for tables to become active
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('👤 Creating Users...');

        const adminUser = await User.createWithHash({
            username: 'admin',
            email: 'admin@cpms.com',
            password: 'password123',
            fullName: 'System Admin',
            role: 'ADMIN',
            approvalStatus: 'APPROVED'
        });
        console.log(`✅ Admin created: ${adminUser.id}`);

        const studentUser = await User.createWithHash({
            username: 'john_doe',
            email: 'john@student.com',
            password: 'password123',
            fullName: 'John Doe',
            role: 'STUDENT',
            approvalStatus: 'APPROVED',
            isActive: true
        });
        console.log(`✅ Student user created: ${studentUser.id}`);

        const staffUser = await User.createWithHash({
            username: 'jane_staff',
            email: 'jane@staff.com',
            password: 'password123',
            fullName: 'Jane Staff',
            role: 'STAFF',
            approvalStatus: 'APPROVED'
        });
        console.log(`✅ Staff user created: ${staffUser.id}`);

        console.log('🏢 Creating Companies...');
        const google = await Company.create({
            name: 'Google',
            email: 'careers@google.com',
            website: 'https://google.com',
            jobRoles: ['Software Engineer'],
            packageLpa: 32,
            hiringStatus: 'OPEN',
            minCgpa: 8.5,
            eligibleDepartments: ['CSE', 'ECE'],
            description: 'Search engine giant.'
        });
        console.log(`✅ Google created: ${google.id}`);

        const amazon = await Company.create({
            name: 'Amazon',
            email: 'jobs@amazon.com',
            website: 'https://amazon.jobs',
            jobRoles: ['SDE-1'],
            packageLpa: 28,
            hiringStatus: 'OPEN',
            minCgpa: 8.0,
            eligibleDepartments: ['CSE', 'IT', 'ECE'],
            description: 'E-commerce giant.'
        });
        console.log(`✅ Amazon created: ${amazon.id}`);

        console.log('🎓 Creating Student Profile...');
        await Student.create({
            userId: studentUser.id,
            name: studentUser.fullName,
            email: studentUser.email,
            phone: '9876543210',
            department: 'CSE',
            batchYear: 2025,
            cgpa: 9.2,
            placementStatus: 'NOT_PLACED'
        });

        console.log('✅ Data Seeding Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
