import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
    constructor(private readonly rewardsService: RewardsService) { }

    @Get()
    findAll() {
        return this.rewardsService.findAll();
    }

    @Get('my-redemptions')
    getMyRedemptions(@Request() req) {
        return this.rewardsService.getMyRedemptions(req.user.userId);
    }

    @Post(':id/redeem')
    redeem(@Param('id') id: string, @Request() req) {
        return this.rewardsService.redeem(id, req.user.userId);
    }

    @Post('seed')
    seed() {
        return this.rewardsService.seed();
    }
}
