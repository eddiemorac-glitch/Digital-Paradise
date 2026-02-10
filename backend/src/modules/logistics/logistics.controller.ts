import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { MissionType } from '../../shared/enums/mission-type.enum';
import { OrderStatus } from '../../shared/enums/order-status.enum';
import { CreateMissionDto } from './dto/create-mission.dto';
import { AssignCourierDto, ForceCancelMissionDto } from '../orders/dto/admin-orders.dto';

@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Post('missions')
    create(@Request() req, @Body() createMissionDto: CreateMissionDto) {
        return this.logisticsService.createMission({
            ...createMissionDto,
            clientId: req.user.userId,
        });
    }

    @Get('missions/nearby')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    findNearby(
        @Query('lat') lat: number,
        @Query('lng') lng: number,
        @Query('radius') radius: number,
    ) {
        return this.logisticsService.findNearby(lat, lng, radius);
    }

    @Get('missions/available')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY, UserRole.ADMIN)
    findAllAvailable(@Query('type') type?: MissionType) {
        return this.logisticsService.findAllAvailable(type);
    }

    @Get('missions/mine')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    findMine(@Request() req) {
        return this.logisticsService.findByCourier(req.user.userId);
    }

    @Post('missions/:id/claim')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    claim(@Param('id') id: string, @Request() req) {
        return this.logisticsService.claimMission(id, req.user.userId);
    }

    @Post('missions/:id/release')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    release(@Param('id') id: string, @Request() req) {
        return this.logisticsService.releaseMission(id, req.user.userId);
    }

    @Patch('missions/:id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY, UserRole.MERCHANT)
    updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.logisticsService.updateStatus(id, status);
    }

    /**
     * Verify delivery with OTP (Phase 20 POD)
     */
    @Post('missions/:id/verify-delivery')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    verifyDelivery(
        @Param('id') id: string,
        @Body('otp') otp: string,
        @Request() req,
        @Body('metadata') metadata?: any
    ) {
        return this.logisticsService.verifyDelivery(id, req.user.userId, otp, metadata);
    }

    // ==================== ADMIN LOGISTICS ENDPOINTS ====================

    @Get('admin/missions')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getAllMissions(@Query('status') status?: OrderStatus) {
        return this.logisticsService.findAllMissions(status);
    }

    @Post('admin/missions/:id/assign')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    assignCourier(
        @Param('id') id: string,
        @Body() dto: AssignCourierDto,
        @Request() req
    ) {
        return this.logisticsService.adminAssignCourier(id, dto.courierId, req.user.userId);
    }

    @Post('admin/missions/:id/cancel')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    forceCancel(
        @Param('id') id: string,
        @Body() dto: ForceCancelMissionDto,
        @Request() req
    ) {
        return this.logisticsService.forceCancelMission(id, req.user.userId, dto.reason);
    }

    @Get('admin/couriers/pending')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getPendingCouriers() {
        return this.logisticsService.findAllPendingCouriers();
    }

    @Patch('admin/couriers/:id/verify')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    verifyCourier(
        @Param('id') id: string,
        @Body('status') status: 'VERIFIED' | 'REJECTED',
        @Body('reason') reason?: string
    ) {
        return this.logisticsService.verifyCourier(id, status, reason);
    }
}
