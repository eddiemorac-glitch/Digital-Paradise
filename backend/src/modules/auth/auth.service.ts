import { Injectable, UnauthorizedException, ConflictException, Logger, Inject, forwardRef } from '@nestjs/common';
import { TokenService } from './token.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

import { EmailsService } from '../emails/emails.service';
import { v4 as uuidv4 } from 'uuid';
import { RegisterMerchantDto, RegisterCourierDto } from './dto/auth.dto';
import { UserRole } from '../../shared/enums/user-role.enum';
import { MerchantsService } from '../merchants/merchants.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        private readonly tokenService: TokenService,
        private readonly emailsService: EmailsService,
        @Inject(forwardRef(() => MerchantsService))
        private readonly merchantsService: MerchantsService,
        private readonly dataSource: DataSource,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, fullName, agreedToPrivacyPolicy, privacyPolicyVersion } = registerDto;

        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await argon2.hash(password);

        const verificationToken = uuidv4();

        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            fullName,
            avatarId: registerDto.avatarId,
            agreedToPrivacyPolicy,
            privacyPolicyVersion,
            privacyPolicyAgreedAt: new Date(),
            emailVerificationToken: verificationToken,
            isEmailVerified: false,
        });

        await this.userRepository.save(user);

        // Send verification email asynchronously
        this.emailsService.sendVerificationEmail(email, fullName, verificationToken)
            .catch(err => console.error('Failed to send verification email:', err));

        return {
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
            }
        };
    }

    async registerMerchant(dto: RegisterMerchantDto) {
        const { email, password, fullName, merchantName, address, category, phone, latitude, longitude, agreedToPrivacyPolicy, privacyPolicyVersion } = dto;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }

            const hashedPassword = await argon2.hash(password);
            const verificationToken = uuidv4();

            const user = this.userRepository.create({
                email,
                password: hashedPassword,
                fullName,
                avatarId: dto.avatarId,
                role: UserRole.MERCHANT,
                agreedToPrivacyPolicy,
                privacyPolicyVersion,
                privacyPolicyAgreedAt: new Date(),
                emailVerificationToken: verificationToken,
                isEmailVerified: false,
            });

            const savedUser = await queryRunner.manager.save(user);

            await this.merchantsService.create({
                name: merchantName,
                address,
                category,
                phone,
                latitude,
                longitude,
                userId: savedUser.id,
            });

            await queryRunner.commitTransaction();

            // Send verification email asynchronously
            this.emailsService.sendVerificationEmail(email, fullName, verificationToken)
                .catch(err => console.error('Failed to send verification email:', err));

            return {
                message: 'Merchant registration successful. Please check your email to verify your account.',
                user: {
                    id: savedUser.id,
                    email: savedUser.email,
                    fullName: savedUser.fullName,
                }
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async registerCourier(dto: RegisterCourierDto) {
        const { email, password, fullName, vehicleType, vehiclePlate, agreedToPrivacyPolicy, privacyPolicyVersion } = dto;

        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await argon2.hash(password);
        const verificationToken = uuidv4();

        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            fullName,
            avatarId: dto.avatarId,
            role: UserRole.DELIVERY,
            courierStatus: 'PENDING',
            vehicleType,
            vehiclePlate,
            agreedToPrivacyPolicy,
            privacyPolicyVersion,
            privacyPolicyAgreedAt: new Date(),
            emailVerificationToken: verificationToken,
            isEmailVerified: false,
        });

        await this.userRepository.save(user);

        // Send verification email asynchronously
        this.emailsService.sendVerificationEmail(email, fullName, verificationToken)
            .catch(err => console.error('Failed to send verification email:', err));

        return {
            message: 'Courier registration successful. Pending approval.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.courierStatus
            }
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'fullName', 'avatarId', 'role']
        });

        if (!user || !(await argon2.verify(user.password, password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.finalizeLogin(user);
    }

    /**
     * Finalizes the login process by generating tokens and storing the refresh token hash.
     * This is used by both standard and biometric login flows.
     */
    async finalizeLogin(user: any) {
        const tokens = this.tokenService.generateTokenPair(user);

        // Store hashed refresh token for rotation and multi-session support
        const refreshTokenHash = await argon2.hash(tokens.refresh_token);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const refreshTokenEntry = this.refreshTokenRepository.create({
            token: refreshTokenHash,
            userId: user.id,
            expiresAt,
        });
        await this.refreshTokenRepository.save(refreshTokenEntry);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarId: user.avatarId,
                role: user.role,
            },
        };
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (user && await argon2.verify(user.password, pass)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async verifyEmail(token: string) {
        const user = await this.userRepository.findOne({ where: { emailVerificationToken: token } });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired verification token');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        await this.userRepository.save(user);

        return { message: 'Email verified successfully' };
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            // Return success anyway to prevent email enumeration
            return { message: 'If this email exists, a reset link has been sent.' };
        }

        const resetToken = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 hour expiry

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = expires;
        await this.userRepository.save(user);

        await this.emailsService.sendPasswordResetEmail(user.email, user.fullName, resetToken);

        return { message: 'If this email exists, a reset link has been sent.' };
    }

    async resetPassword(token: string, registerDto: Partial<RegisterDto>) {
        const user = await this.userRepository.findOne({
            where: { passwordResetToken: token }
        });

        if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        if (registerDto.password) {
            user.password = await argon2.hash(registerDto.password);
        }
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await this.userRepository.save(user);

        return { message: 'Password reset successfully' };
    }

    async refreshTokens(refreshToken: string) {
        const payload = this.tokenService.verifyRefreshToken(refreshToken);

        const storedToken = await this.refreshTokenRepository.findOne({
            where: { userId: payload.sub, isRevoked: false },
            order: { createdAt: 'DESC' }
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Token not found, expired or revoked');
        }

        const isMatch = await argon2.verify(storedToken.token, refreshToken);
        if (!isMatch) {
            // Check for Graceful Reuse (Network retry / Race condition)
            // Safety check: updatedAt might be null for legacy tokens
            if (storedToken.updatedAt) {
                const timeSinceUpdate = new Date().getTime() - storedToken.updatedAt.getTime();
                const GRACE_PERIOD = 30000; // 30 seconds

                if (timeSinceUpdate < GRACE_PERIOD) {
                    this.logger.warn(`Graceful reuse detection for user ${payload.sub} (Updated ${timeSinceUpdate}ms ago). Denying without revocation.`);
                    throw new UnauthorizedException('Token invalid (recently rotated)');
                }
            }

            // Potential reuse attack! Revoke all tokens for this user.
            await this.refreshTokenRepository.update({ userId: payload.sub }, { isRevoked: true });
            throw new UnauthorizedException('Token reuse detected. All sessions revoked for security.');
        }

        const user = await this.userRepository.findOne({
            where: { id: payload.sub },
            select: ['id', 'email', 'fullName', 'avatarId', 'role']
        });

        if (!user) throw new UnauthorizedException('User no longer exists');

        const tokens = this.tokenService.generateTokenPair(user);

        // Rotate: update entry
        const newRefreshTokenHash = await argon2.hash(tokens.refresh_token);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        storedToken.token = newRefreshTokenHash;
        storedToken.expiresAt = expiresAt;
        await this.refreshTokenRepository.save(storedToken);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarId: user.avatarId,
                role: user.role,
            },
        };
    }

    async logout(userId: string) {
        await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
        return { message: 'Logged out successfully' };
    }
}
