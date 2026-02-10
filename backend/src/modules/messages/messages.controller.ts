import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get('order/:orderId')
    findAllByOrder(@Param('orderId') orderId: string) {
        return this.messagesService.findByOrder(orderId);
    }
}
