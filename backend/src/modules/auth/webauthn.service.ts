import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Passkey } from '../users/entities/passkey.entity';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';

@Injectable()
export class WebAuthnService {
    private readonly logger = new Logger(WebAuthnService.name);
    private readonly rpName = 'DIGITAL PARADISE';
    private readonly rpID: string;
    private readonly origin: string;

    constructor(
        private configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Passkey)
        private readonly passkeyRepository: Repository<Passkey>,
    ) {
        this.rpID = this.configService.get('WEBAUTHN_RP_ID', 'localhost');
        this.origin = this.configService.get('WEBAUTHN_ORIGIN', 'http://localhost:5173');
    }

    async getUserByEmail(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new UnauthorizedException('User not found');
        return { user };
    }

    async generateRegistrationOptions(user: User) {
        const userPasskeys = await this.passkeyRepository.find({ where: { userId: user.id } });

        const options = await generateRegistrationOptions({
            rpName: this.rpName,
            rpID: this.rpID,
            userID: new TextEncoder().encode(user.id),
            userName: user.email,
            userDisplayName: user.fullName,
            attestationType: 'none',
            excludeCredentials: userPasskeys.map(pk => ({
                id: pk.credentialID,
                type: 'public-key',
                transports: pk.transports.split(',') as any,
            })),
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'preferred',
            },
        });

        // Store challenge in cache for 5 minutes
        await this.cacheManager.set(`webauthn_reg_challenge_${user.id}`, options.challenge, 300000);

        return options;
    }

    async verifyRegistration(user: User, body: any) {
        const currentChallenge = await this.cacheManager.get<string>(`webauthn_reg_challenge_${user.id}`);
        if (!currentChallenge) throw new UnauthorizedException('Registration challenge expired');

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: currentChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;

            const passkey = this.passkeyRepository.create({
                credentialID: credential.id,
                publicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                deviceType: 'singleDevice',
                backedUp: true,
                transports: body.response.transports?.join(',') || 'internal',
                userId: user.id,
            });

            await this.passkeyRepository.save(passkey);
            await this.cacheManager.del(`webauthn_reg_challenge_${user.id}`);
            return { verified: true };
        }

        throw new UnauthorizedException('Registration failed');
    }

    async generateAuthenticationOptions(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new UnauthorizedException('User not found');

        const userPasskeys = await this.passkeyRepository.find({ where: { userId: user.id } });

        const options = await generateAuthenticationOptions({
            rpID: this.rpID,
            allowCredentials: userPasskeys.map(pk => ({
                id: pk.credentialID,
                type: 'public-key',
                transports: pk.transports.split(',') as any,
            })),
            userVerification: 'preferred',
        });

        // Store challenge in cache for 5 minutes
        await this.cacheManager.set(`webauthn_auth_challenge_${user.id}`, options.challenge, 300000);

        return { options, user };
    }

    async verifyAuthentication(user: User, body: any) {
        const currentChallenge = await this.cacheManager.get<string>(`webauthn_auth_challenge_${user.id}`);
        if (!currentChallenge) throw new UnauthorizedException('Authentication challenge expired');

        const passkey = await this.passkeyRepository.findOne({
            where: { credentialID: body.id, userId: user.id }
        });

        if (!passkey) throw new UnauthorizedException('Authenticator not found');

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: currentChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            credential: {
                id: passkey.credentialID,
                publicKey: new Uint8Array(passkey.publicKey),
                counter: passkey.counter,
            },
        });

        if (verification.verified) {
            passkey.counter = verification.authenticationInfo.newCounter;
            await this.passkeyRepository.save(passkey);
            await this.cacheManager.del(`webauthn_auth_challenge_${user.id}`);
            return { verified: true };
        }

        throw new UnauthorizedException('Authentication failed');
    }

    async listPasskeys(userId: string) {
        return this.passkeyRepository.find({
            where: { userId },
            select: ['id', 'credentialID', 'deviceType', 'createdAt']
        });
    }

    async deletePasskey(userId: string, passkeyId: string) {
        const passkey = await this.passkeyRepository.findOne({
            where: { id: passkeyId, userId }
        });

        if (!passkey) {
            throw new UnauthorizedException('Passkey not found or not owned by user');
        }

        await this.passkeyRepository.remove(passkey);
        return { success: true };
    }
}
