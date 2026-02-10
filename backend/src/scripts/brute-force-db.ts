
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const passwordsToTry = [
    'postgres',
    'admin',
    'root',
    '123456',
    'password',
    'caribe',
    'caribedigital',
    'devpassword',
    'masterkey',
    'tortuga123'
];

async function tryPassword(password: string) {
    console.log(`Trying password: ${password}`);
    const AppDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: 'postgres',
        password: password,
        database: 'postgres', // Connect to default DB first
        synchronize: false,
        logging: false,
    });

    try {
        await AppDataSource.initialize();
        console.log(`✅ SUCCESS! Password is: ${password}`);
        await AppDataSource.destroy();
        return password;
    } catch (err) {
        // console.error(`❌ Failed with ${password}`); // Reduce noise
        return null;
    }
}

async function bruteForce() {
    console.log('Starting brute force...');
    for (const pass of passwordsToTry) {
        const result = await tryPassword(pass);
        if (result) {
            console.log(`\n🎉 FOUND PASSWORD: ${result}`);
            process.exit(0);
        }
    }
    console.log('\n❌ Could not find password in common list.');
    process.exit(1);
}

bruteForce();
