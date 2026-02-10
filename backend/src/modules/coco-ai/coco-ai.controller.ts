import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { CocoAiService } from './coco-ai.service';
import { PublicJwtAuthGuard } from '../auth/guards/public-jwt-auth.guard';

@Controller('coco-ai')
export class CocoAiController {
    constructor(private readonly cocoAiService: CocoAiService) { }

    @Post('chat')
    @UseGuards(PublicJwtAuthGuard)
    async chat(@Body() body: { message: string }, @Req() req: any) {
        return this.cocoAiService.chat(body.message, req.user);
    }

    @Post('chat-stream')
    @UseGuards(PublicJwtAuthGuard)
    async chatStream(@Body() body: { message: string }, @Req() req: any, @Res() res: any) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const generator = this.cocoAiService.chatStream(body.message, req.user);

        try {
            for await (const content of generator) {
                if (content) {
                    res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                }
            }
            res.end();
        } catch (err) {
            console.error('Stream Error:', err);
            res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
            res.end();
        }
    }
}
