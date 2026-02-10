import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { BroadcastDto } from './dto/broadcast.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('mine')
    findAll(@Request() req) {
        return this.notificationsService.findAllForUser(req.user.userId);
    }

    @Post(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Post('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @Post('broadcast')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    broadcast(@Body() dto: BroadcastDto) {
        return this.notificationsService.broadcastToAll(dto);
    }
}
