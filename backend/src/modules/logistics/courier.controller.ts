import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { CourierService } from './courier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';

@Controller('courier')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY)
export class CourierController {
    constructor(private readonly courierService: CourierService) { }

    @Get('stats')
    getStats(@Request() req) {
        return this.courierService.getStats(req.user.userId);
    }

    @Get('profile')
    getProfile(@Request() req) {
        return this.courierService.getProfile(req.user.userId);
    }

    @Get('earnings')
    getEarningsHistory(@Request() req, @Query('days') days?: number) {
        return this.courierService.getEarningsHistory(req.user.userId, days || 30);
    }
}
