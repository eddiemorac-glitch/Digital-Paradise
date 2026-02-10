import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../shared/enums/user-role.enum';

export class InviteUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
}
