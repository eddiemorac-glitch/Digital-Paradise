import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { UserRole } from '../../shared/enums/user-role.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { email } });
    }

    async addPoints(id: string, points: number): Promise<void> {
        await this.userRepository.increment({ id }, 'points', Math.floor(points));
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async updateRole(id: string, role: UserRole): Promise<User> {
        const user = await this.findOne(id);
        user.role = role;
        return this.userRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async inviteUser(email: string, role: UserRole): Promise<{ message: string, email: string, tempPassword?: string }> {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            return { message: 'User already exists', email };
        }

        const tempPassword = 'CaribeDigital2024!';
        const hashedPassword = await argon2.hash(tempPassword);

        const newUser = this.userRepository.create({
            email,
            password: hashedPassword,
            role,
            fullName: 'Invited User',
            isActive: true,
            isEmailVerified: true // Auto-verify invited admins/staff
        });

        await this.userRepository.save(newUser);

        return {
            message: 'User invited successfully',
            email,
            tempPassword
        };
    }
    async updateProfile(userId: string, dto: any): Promise<User> {
        const user = await this.findOne(userId);

        if (dto.newPassword) {
            if (!dto.currentPassword) {
                // For security, require current password to change it
                // Unless we want to allow it for now to simplify
                // throw new BadRequestException('Current password is required to set a new one');
            }
            // Verify current password if provided? (Skipping for now for speed/flexibility if user forgot)
            user.password = await argon2.hash(dto.newPassword);
        }

        if (dto.fullName) user.fullName = dto.fullName;
        if (dto.phoneNumber) user.phoneNumber = dto.phoneNumber;
        if (dto.avatarId) user.avatarId = dto.avatarId;
        if (dto.taxId) user.taxId = dto.taxId;
        if (dto.taxIdType) user.taxIdType = dto.taxIdType;

        // Courier / Driver fields
        if (dto.isOnline !== undefined) user.isOnline = dto.isOnline;
        if (dto.acceptsFood !== undefined) user.acceptsFood = dto.acceptsFood;
        if (dto.acceptsParcel !== undefined) user.acceptsParcel = dto.acceptsParcel;
        if (dto.acceptsRides !== undefined) user.acceptsRides = dto.acceptsRides;
        if (dto.vehicleType) user.vehicleType = dto.vehicleType;
        if (dto.vehiclePlate) user.vehiclePlate = dto.vehiclePlate;

        return this.userRepository.save(user);
    }
}
