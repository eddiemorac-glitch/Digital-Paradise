import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LegalService } from './legal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('legal')
export class LegalController {
    constructor(private readonly legalService: LegalService) { }

    @UseGuards(JwtAuthGuard)
    @Post('arco-request')
    async createArcoRequest(@Req() req, @Body() body: { type: any, details: string }) {
        return this.legalService.handleArcoRequest(req.user.id, body.type, body.details);
    }
}
