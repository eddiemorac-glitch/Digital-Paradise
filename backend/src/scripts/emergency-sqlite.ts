import { createConnection } from 'typeorm';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const createDatabaseWithEmbedded = async () => {
  console.log('🚨 Emergency Mode: Creating embedded database setup...');
  
  // Try SQLite as fallback
  try {
    console.log('Testing SQLite as fallback...');
    const sqliteConnection = await createConnection({
      type: 'sqlite',
      database: join(__dirname, '../../data/caribe_digital.sqlite'),
      logging: true,
      synchronize: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    });
    
    console.log('✅ SQLite database created successfully!');
    console.log('Location: ', join(__dirname, '../../data/caribe_digital.sqlite'));
    
    // Test basic operations
    await sqliteConnection.query('SELECT 1');
    console.log('✅ Database operations working');
    
    await sqliteConnection.close();
    
    // Create temporary .env for SQLite
    const fs = require('fs');
    const envPath = join(__dirname, '../../.env');
    const backupPath = join(__dirname, '../../.env.backup');
    
    // Backup original .env
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, backupPath);
      console.log('✅ Original .env backed up');
    }
    
    // Create SQLite configuration
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent += '\n\n# EMERGENCY SQLITE MODE\n';
    envContent += 'DB_TYPE=sqlite\n';
    envContent += `DB_DATABASE=${join(__dirname, '../../data/caribe_digital.sqlite')}\n`;
    envContent += '# Comment out PostgreSQL config:\n';
    envContent += '# DB_HOST=localhost\n';
    envContent += '# DB_PORT=5432\n';
    envContent += '# DB_USERNAME=postgres\n';
    envContent += '# DB_PASSWORD=caribe2024\n';
    envContent += '# DB_NAME=caribe_digital\n';
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Emergency SQLite configuration applied');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Backend can now start with SQLite');
    console.log('2. Fix PostgreSQL later for production');
    console.log('3. Run: npm run start:dev');
    
    return true;
    
  } catch (error) {
    console.error('❌ SQLite setup failed:', error.message);
    return false;
  }
};

createDatabaseWithEmbedded().then(success => {
  if (success) {
    console.log('\n✅ Emergency database ready');
    process.exit(0);
  } else {
    console.log('\n❌ Emergency setup failed');
    process.exit(1);
  }
});