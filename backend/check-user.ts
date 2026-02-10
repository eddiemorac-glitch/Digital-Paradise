import { DataSource } from 'typeorm';
import { typeOrmConfig } from './src/config/typeorm.config';
import { User } from './src/modules/users/entities/user.entity';

async function checkUser() {
    const ds = new DataSource(typeOrmConfig as any);
    try {
        await ds.initialize();
        const user = await ds.getRepository(User).findOne({ where: { email: 'admin@caribe.com' } });
        console.log(user ? JSON.stringify(user, null, 2) : 'User not found');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await ds.destroy();
    }
}

checkUser();
