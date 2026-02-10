import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalService } from './legal.service';
import { LegalController } from './legal.controller';
import { User } from '../users/entities/user.entity';
import { EmailsModule } from '../emails/emails.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        EmailsModule
    ],
    controllers: [LegalController],
    providers: [LegalService],
})
export class LegalModule { }
