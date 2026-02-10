import { Controller, Get, Patch, Delete, Post, Param, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        this.logger.debug(`GET /profile - userId: ${req.user?.userId}`);
        if (!req.user) {
            this.logger.error('req.user is undefined - JWT guard may have failed');
        }
        return this.usersService.findOne(req.user.userId);
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    updateProfile(@Request() req, @Body() dto: Partial<any>) { // Using Partial<any> or DTO if imported
        return this.usersService.updateProfile(req.user.userId, dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Patch(':id/role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.usersService.updateRole(id, dto.role);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Post('invite')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    invite(@Body() dto: InviteUserDto) {
        return this.usersService.inviteUser(dto.email, dto.role);
    }
}
