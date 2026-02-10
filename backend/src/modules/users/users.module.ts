import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Passkey } from './entities/passkey.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, RefreshToken, Passkey])],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule { }
