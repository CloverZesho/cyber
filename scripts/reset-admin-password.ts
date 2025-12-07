import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
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

async function resetAdminPassword() {
  const email = 'ikhan@cyberwheelhouse.com';
  const password = 'Cyberwheelhouse123_@ikhan';
  const name = 'Super Admin';

  console.log('🔍 Checking existing users in database...\n');

  try {
    // List all users
    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
    }));

    console.log(`Found ${scanResult.Items?.length || 0} users in database:\n`);
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const user of scanResult.Items) {
        console.log(`  - ${user.email} (role: ${user.role}, id: ${user.id})`);
      }
    }

    // Find existing user with this email
    const existingUser = scanResult.Items?.find(u => u.email === email);

    if (existingUser) {
      console.log(`\n🔄 Found existing user with email ${email}`);
      console.log(`   Deleting and recreating with correct password...`);
      
      // Delete the existing user
      await docClient.send(new DeleteCommand({
        TableName: USERS_TABLE,
        Key: { id: existingUser.id },
      }));
      
      console.log('   ✓ Old user deleted');
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    const userId = uuidv4();

    const user = {
      id: userId,
      email: email,
      password: hashedPassword,
      name: name,
      companyName: 'Cyber Wheelhouse',
      role: 'admin',
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    }));

    console.log('\n✅ Super Admin account ready!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ikhan@cyberwheelhouse.com');
    console.log('🔑 Password: Cyberwheelhouse123_@ikhan');
    console.log('👤 Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 Login at: http://localhost:3000/login');

    // Verify the password hash works
    const testVerify = await bcrypt.compare(password, hashedPassword);
    console.log(`\n🔐 Password verification test: ${testVerify ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();

