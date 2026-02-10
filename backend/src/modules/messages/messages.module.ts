import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { MessagesController } from './messages.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Message])],
    providers: [MessagesService, MessagesGateway],
    controllers: [MessagesController],
})
export class MessagesModule { }
