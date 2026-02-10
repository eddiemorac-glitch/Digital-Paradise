import { createConnection } from 'typeorm';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const testConnection = async () => {
  console.log('🔍 Testing multiple database configurations...');
  
  const configs = [
    { username: 'postgres', password: 'postgres', name: 'Default postgres/postgres' },
    { username: 'postgres', password: 'devpassword', name: 'postgres/devpassword' },
    { username: 'devuser', password: 'devpassword', name: 'devuser/devpassword' },
    { username: 'postgres', password: '', name: 'postgres/empty' },
  ];
  
  for (const config of configs) {
    try {
      console.log(`\nTrying ${config.name}...`);
      
      const connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: config.username,
        password: config.password,
        database: 'postgres', // Try default db first
        logging: false,
      });
      
      console.log(`✅ SUCCESS with ${config.name}`);
      
      // Check if caribe_digital exists
      const dbResult = await connection.query(`SELECT 1 FROM pg_database WHERE datname = 'caribe_digital'`);
      if (dbResult.length === 0) {
        console.log('Creating caribe_digital database...');
        await connection.query(`CREATE DATABASE caribe_digital`);
      }
      
      await connection.close();
      return config;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ All configurations failed');
  return null;
};

testConnection().then(success => {
  if (success) {
    console.log(`\n✅ Working configuration found: ${success.name}`);
    console.log('Update your .env file with these credentials:');
    console.log(`DB_USERNAME=${success.username}`);
    console.log(`DB_PASSWORD=${success.password}`);
  }
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});