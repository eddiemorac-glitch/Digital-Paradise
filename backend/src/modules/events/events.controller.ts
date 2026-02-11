import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, ParseFloatPipe, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventRequestsService } from './event-requests.service';
import { CreateEventRequestDto } from './dto/create-event-request.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { EventRequestStatus } from './entities/event-request.entity';

@Controller('events')
export class EventsController {
    constructor(
        private readonly eventsService: EventsService,
        private readonly eventRequestsService: EventRequestsService
    ) { }

    @Get()
    findAll() {
        return this.eventsService.findAll();
    }

    @Get('pricing')
    getPricing() {
        return this.eventsService.getPricing();
    }

    @Get('nearby')
    findNearby(
        @Query('lat', ParseFloatPipe) lat: number,
        @Query('lng', ParseFloatPipe) lng: number,
        @Query('radius', new ParseFloatPipe({ optional: true })) radius?: number,
    ) {
        // Basic range validation
        if (lat < -90 || lat > 90) throw new BadRequestException('Invalid latitude');
        if (lng < -180 || lng > 180) throw new BadRequestException('Invalid longitude');
        return this.eventsService.findNearbyEvents(lat, lng, radius || 5);
    }

    @Get('bounds')
    findInBounds(
        @Query('minLat', ParseFloatPipe) minLat: number,
        @Query('maxLat', ParseFloatPipe) maxLat: number,
        @Query('minLng', ParseFloatPipe) minLng: number,
        @Query('maxLng', ParseFloatPipe) maxLng: number,
    ) {
        return this.eventsService.findInBounds(minLat, maxLat, minLng, maxLng);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Post('bulk')
    findByIds(@Body('ids') ids: string[]) {
        return this.eventsService.findByIds(ids);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    create(@Body() data: CreateEventDto) {
        return this.eventsService.create(data);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    update(@Param('id') id: string, @Body() data: UpdateEventDto) {
        return this.eventsService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    remove(@Param('id') id: string) {
        return this.eventsService.remove(id);
    }

    // ==================== EVENT REQUESTS (Phase 44) ====================

    @Post('requests')
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.CLIENT) // Users can also request events in the store
    createRequest(@Body() data: CreateEventRequestDto, @GetUser() user: User) {
        return this.eventRequestsService.create(data, user);
    }

    @Get('requests/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    getAllRequests(@Query('status') status?: EventRequestStatus) {
        return this.eventRequestsService.findAll(status);
    }

    @Get('requests/my')
    @UseGuards(JwtAuthGuard)
    getMyRequests(@GetUser() user: User) {
        return this.eventRequestsService.findMyRequests(user.id);
    }

    @Patch('requests/:id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    updateRequestStatus(
        @Param('id') id: string,
        @Body('status') status: EventRequestStatus,
        @Body('rejectionReason') rejectionReason?: string
    ) {
        return this.eventRequestsService.updateStatus(id, status, rejectionReason);
    }

    @Post('seed')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    seed() {
        return this.eventsService.seed();
    }
}
