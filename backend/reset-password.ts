import { DataSource } from 'typeorm';
import { typeOrmConfig } from './src/config/typeorm.config';
import { User } from './src/modules/users/entities/user.entity';
import * as argon2 from 'argon2';

async function resetPassword() {
    const ds = new DataSource(typeOrmConfig as any);
    try {
        await ds.initialize();
        const user = await ds.getRepository(User).findOne({ where: { email: 'admin@caribe.com' } });
        if (user) {
            user.password = await argon2.hash('Admin123!');
            await ds.getRepository(User).save(user);
            console.log('Password reset successfully for admin@caribe.com');
        } else {
            console.log('Admin user not found');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await ds.destroy();
    }
}

resetPassword();
