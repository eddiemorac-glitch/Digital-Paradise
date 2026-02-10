import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';

@Controller('blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) { }

    @Get()
    findAll(@Query('status') status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
        return this.blogService.findAll(status);
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAllAdmin() {
        return this.blogService.findAllAdmin();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.blogService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    create(@Request() req, @Body() data: any) {
        return this.blogService.create(data, req.user.userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    update(@Param('id') id: string, @Body() data: any) {
        return this.blogService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.blogService.remove(id);
    }
}
