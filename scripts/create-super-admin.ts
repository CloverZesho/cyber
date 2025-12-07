import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'cwh_';
const USERS_TABLE = `${TABLE_PREFIX}Users`;

async function createSuperAdmin() {
  const email = 'ikhan@cyberwheelhouse.com';
  const password = 'Cyberwheelhouse123_@ikhan';
  const name = 'Super Admin';

  console.log('🔐 Creating Super Admin Account...\n');

  try {
    // Check if user already exists
    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: '#email = :email',
      ExpressionAttributeNames: { '#email': 'email' },
      ExpressionAttributeValues: { ':email': email },
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log('⚠️  User with this email already exists!');
      console.log('   Updating existing user to admin role...');
      
      // Update existing user - we'll just create new one with same email
      // In a real app you'd use UpdateCommand, but for simplicity:
      const existingUser = scanResult.Items[0];
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Current role: ${existingUser.role}`);
      
      if (existingUser.role === 'admin') {
        console.log('\n✅ User is already an admin!');
        console.log('\n📧 Email: ikhan@cyberwheelhouse.com');
        console.log('🔑 Password: Cyberwheelhouse123_@ikhan');
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const now = new Date().toISOString();
    const userId = uuidv4();

    const user = {
      id: userId,
      email: email,
      password: hashedPassword,
      name: name,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    }));

    console.log('✅ Super Admin created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ikhan@cyberwheelhouse.com');
    console.log('🔑 Password: Cyberwheelhouse123_@ikhan');
    console.log('👤 Role:     admin (Super Admin)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 Login at: http://localhost:3000/login');
    console.log('   You will be redirected to /admin after login');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();

