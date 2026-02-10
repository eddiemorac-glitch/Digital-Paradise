import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../shared/enums/user-role.enum';

@Injectable()
export class TokenService {
    private readonly accessTokenSecret: string;
    private readonly refreshTokenSecret: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.accessTokenSecret = this.configService.getOrThrow<string>('JWT_SECRET');
        this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.accessTokenSecret + '_refresh';
    }

    generateAccessToken(user: { id: string; email: string; role: UserRole }): string {
        const payload = { sub: user.id, email: user.email, role: user.role, type: 'access' };
        return this.jwtService.sign(payload, {
            secret: this.accessTokenSecret,
            expiresIn: '15m', // Short-lived access token
        });
    }

    generateRefreshToken(user: { id: string; email: string; role: UserRole }): string {
        const payload = { sub: user.id, email: user.email, role: user.role, type: 'refresh' };
        return this.jwtService.sign(payload, {
            secret: this.refreshTokenSecret,
            expiresIn: '7d', // Long-lived refresh token
        });
    }

    generateTokenPair(user: { id: string; email: string; role: UserRole }) {
        return {
            access_token: this.generateAccessToken(user),
            refresh_token: this.generateRefreshToken(user),
        };
    }

    verifyAccessToken(token: string) {
        try {
            return this.jwtService.verify(token, { secret: this.accessTokenSecret });
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }

    verifyRefreshToken(token: string) {
        try {
            const payload = this.jwtService.verify(token, { secret: this.refreshTokenSecret });
            if (payload.type !== 'refresh') {
                throw new UnauthorizedException('Invalid token type');
            }
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}
