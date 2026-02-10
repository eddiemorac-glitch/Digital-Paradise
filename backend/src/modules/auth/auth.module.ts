import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { Passkey } from '../users/entities/passkey.entity';

import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailsModule } from '../emails/emails.module';
import { MerchantsModule } from '../merchants/merchants.module';

import { WebAuthnService } from './webauthn.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RefreshToken, Passkey]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: (configService.get<string>('JWT_EXPIRATION') || '1h') as any
                },
            }),
        }),
        EmailsModule,
        MerchantsModule,
    ],
    providers: [AuthService, JwtStrategy, TokenService, WebAuthnService],
    controllers: [AuthController],
    exports: [AuthService, TokenService, WebAuthnService],
})
export class AuthModule { }
