import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, Patch, UseGuards, Request, UseInterceptors, UploadedFile, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { FileInterceptor } from '@nestjs/platform-express';
import { MerchantsService } from './merchants.service';
import { MerchantStatus, MerchantCategory } from '../../shared/enums/merchant.enum';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { RejectMerchantDto, SuspendMerchantDto } from './dto/verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';

@Controller('merchants')
export class MerchantsController {
    constructor(private readonly merchantsService: MerchantsService) { }

    @Get('my-merchant')
    @UseGuards(JwtAuthGuard)
    getMyMerchant(@Request() req) {
        return this.merchantsService.findByUser(req.user.userId);
    }

    @Get('my-stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MERCHANT)
    async getMyStats(
        @Request() req,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const merchant = await this.merchantsService.findByUser(req.user.userId);
        return this.merchantsService.getMerchantStats(merchant.id, start, end);
    }

    @Patch(':id/operational-settings')
    @UseGuards(JwtAuthGuard)
    async updateOperationalSettings(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() settings: any,
        @Request() req
    ) {
        const merchant = await this.merchantsService.findOne(id);
        if (merchant.userId !== req.user.userId && req.user.role !== UserRole.ADMIN) {
            throw new UnauthorizedException('Not authorized to update this merchant');
        }
        return this.merchantsService.updateOperationalSettings(id, settings);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createMerchantDto: CreateMerchantDto, @Request() req) {
        // Automatically link the merchant to the creating user if they don't provide one
        if (!createMerchantDto.userId) {
            createMerchantDto.userId = req.user.userId;
        }
        return this.merchantsService.create(createMerchantDto);
    }

    @Get()
    @UseInterceptors(CacheInterceptor)
    @UseGuards(new JwtAuthGuard(true)) // Optional guard (custom implementation needed or just use Request)
    async findAll(
        @Query('status') status?: MerchantStatus,
        @Query('category') category?: MerchantCategory,
        @Query('sortBy') sortBy?: 'rating' | 'distance' | 'name',
        @Query('lat') lat?: number,
        @Query('lng') lng?: number,
        @Query('isSustainable') isSustainable?: string,
        @Query('isActive') isActive?: string,
        @Request() req?: any
    ) {
        // Only pass boolean values if explicitly set in query params
        const sustainableFilter = isSustainable !== undefined ? isSustainable === 'true' : undefined;

        // SECURITY: Only ADMINs can filter for inactive merchants or see all merchants (activeFilter = undefined)
        // Public users always get ONLY active merchants.
        const isAdmin = req?.user?.role === UserRole.ADMIN;
        const activeFilter = isAdmin ? (isActive !== undefined ? isActive === 'true' : undefined) : true;

        return this.merchantsService.findAll(status, category, sortBy, lat, lng, sustainableFilter, activeFilter);
    }

    @Get('radar')
    getRadar() {
        return this.merchantsService.radar();
    }

    @Get('nearby')
    findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
    ) {
        return this.merchantsService.findNearby(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseInt(radius) : 5000,
        );
    }

    @Get(':id')
    @UseInterceptors(CacheInterceptor)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.merchantsService.findOne(id);
    }

    @Get(':id/calculate-delivery')
    async calculateDelivery(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('lat') lat: number,
        @Query('lng') lng: number
    ) {
        if (!lat || !lng) throw new BadRequestException('Latitude and Longitude are required');
        return this.merchantsService.calculateDelivery(id, Number(lat), Number(lng));
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMerchantDto: Partial<CreateMerchantDto>,
        @Request() req
    ) {
        // If not admin, verify ownership
        if (req.user.role !== UserRole.ADMIN) {
            const merchant = await this.merchantsService.findOne(id);
            if (merchant.userId !== req.user.userId) {
                throw new UnauthorizedException('You do not own this merchant account');
            }
        }
        return this.merchantsService.update(id, updateMerchantDto);
    }

    // ==================== ADMIN VERIFICATION ENDPOINTS ====================

    /**
     * Get all merchants pending verification
     */
    @Get('admin/pending')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    getPendingMerchants() {
        return this.merchantsService.findPendingApproval();
    }

    /**
     * Approve a merchant
     */
    @Post('admin/:id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    approveMerchant(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.merchantsService.approveMerchant(id, req.user.userId);
    }

    /**
     * Reject a merchant with reason
     */
    @Post('admin/:id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    rejectMerchant(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectMerchantDto,
        @Request() req
    ) {
        return this.merchantsService.rejectMerchant(id, req.user.userId, dto.rejectionReason);
    }

    /**
     * Suspend an active merchant
     */
    @Post('admin/:id/suspend')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    suspendMerchant(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SuspendMerchantDto,
        @Request() req
    ) {
        return this.merchantsService.suspendMerchant(id, req.user.userId, dto.suspensionReason);
    }

    /**
     * Reactivate a suspended merchant
     */
    /**
     * Reactivate a suspended merchant
     */
    @Post('admin/:id/reactivate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    reactivateMerchant(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.merchantsService.reactivateMerchant(id, req.user.userId);
    }

    // ==================== HACIENDA CREDENTIALS (MARKETPLACE) ====================

    @Post(':id/hacienda-credentials')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    @UseInterceptors(FileInterceptor('p12File'))
    async uploadHaciendaCredentials(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { username: string; pin: string; password?: string }, // password is for IDP, pin is for P12
        @Request() req
    ) {
        // Validate ownership if not admin
        if (req.user.role !== UserRole.ADMIN) {
            const merchant = await this.merchantsService.findOne(id);
            if (merchant.userId !== req.user.userId) {
                throw new UnauthorizedException('You do not own this merchant account');
            }
        }

        if (!file) {
            throw new BadRequestException('P12 file is required');
        }

        return this.merchantsService.setHaciendaCredentials(
            id,
            body.username,
            body.password || body.pin, // In some cases PIN is used as password for IDP
            body.pin,
            file.buffer
        );
    }
}
