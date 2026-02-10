import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterMerchantDto } from './dto/auth.dto';
import { WebAuthnService } from './webauthn.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly webauthnService: WebAuthnService,
    ) { }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('register-merchant')
    registerMerchant(@Body() dto: RegisterMerchantDto) {
        return this.authService.registerMerchant(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('webauthn/register-options')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    generateRegistrationOptions(@Req() req: any) {
        return this.webauthnService.generateRegistrationOptions(req.user);
    }

    @Post('webauthn/register-verify')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    verifyRegistration(@Req() req: any, @Body() body: any) {
        return this.webauthnService.verifyRegistration(req.user, body);
    }

    @Post('webauthn/login-options')
    @HttpCode(HttpStatus.OK)
    generateAuthenticationOptions(@Body('email') email: string) {
        return this.webauthnService.generateAuthenticationOptions(email);
    }

    @Post('webauthn/login-verify')
    @HttpCode(HttpStatus.OK)
    async verifyAuthentication(@Body('email') email: string, @Body('body') body: any) {
        // Fetch user first without generating new options/overwriting challenge
        const { user } = await this.webauthnService.getUserByEmail(email);
        const result = await this.webauthnService.verifyAuthentication(user, body);

        if (result.verified) {
            return this.authService.finalizeLogin(user);
        }
        return result;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(@Body('refresh_token') refreshToken: string) {
        return this.authService.refreshTokens(refreshToken);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    verifyEmail(@Body('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body('token') token: string, @Body() registerDto: Partial<RegisterDto>) {
        return this.authService.resetPassword(token, registerDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    logout(@Req() req: any) {
        return this.authService.logout(req.user.id);
    }

    @Get('webauthn/passkeys')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    listPasskeys(@Req() req: any) {
        return this.webauthnService.listPasskeys(req.user.id);
    }

    @Delete('webauthn/passkeys/:id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    deletePasskey(@Req() req: any, @Param('id') id: string) {
        return this.webauthnService.deletePasskey(req.user.id, id);
    }
}
