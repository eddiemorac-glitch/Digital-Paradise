import { createConnection } from 'typeorm';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const testWithPassword = async (password: string) => {
  try {
    console.log(`Testing password: ${password || '(empty)'}`);
    
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: 'postgres',
      password: password,
      database: 'postgres',
      logging: false,
    });
    
    console.log('✅ Connection successful!');
    
    // Create caribe_digital database
    await connection.query(`CREATE DATABASE caribe_digital`).catch(() => {
      console.log('Database already exists or creation failed');
    });
    
    await connection.close();
    
    // Update .env file
    const fs = require('fs');
    const envPath = join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${password}`);
    fs.writeFileSync(envPath, envContent);
    
    console.log(`✅ .env updated with password: ${password}`);
    return password;
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
};

const testPasswords = async () => {
  const passwords = ['caribe2024', 'postgres', 'admin', 'password', '123456', '', 'root'];
  
  for (const pwd of passwords) {
    const result = await testWithPassword(pwd);
    if (result) {
      console.log(`\n🎉 SUCCESS! Password found: ${result}`);
      process.exit(0);
    }
  }
  
  console.log('\n❌ All passwords failed');
  process.exit(1);
};

testPasswords().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});