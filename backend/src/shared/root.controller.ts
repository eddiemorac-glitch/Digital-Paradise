import { Controller, Get, Res } from '@nestjs/common';

@Controller()
export class RootController {
    @Get()
    redirect(@Res() res) {
        return res.redirect('/api/health');
    }
}
