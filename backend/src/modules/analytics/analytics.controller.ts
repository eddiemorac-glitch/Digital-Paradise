import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('admin/summary')
    @Roles(UserRole.ADMIN)
    getAdminSummary() {
        return this.analyticsService.getAdminSummary();
    }

    @Get('merchant/:id')
    @Roles(UserRole.MERCHANT, UserRole.ADMIN)
    getMerchantAnalytics(@Param('id') id: string) {
        return this.analyticsService.getMerchantAnalytics(id);
    }

    @Get('heatmap')
    @Roles(UserRole.ADMIN)
    getHeatmap() {
        return this.analyticsService.getHeatmapData();
    }
}
