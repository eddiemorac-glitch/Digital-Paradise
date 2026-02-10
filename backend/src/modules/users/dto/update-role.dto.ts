import { IsEnum } from 'class-validator';
import { UserRole } from '../../../shared/enums/user-role.enum';

export class UpdateRoleDto {
    @IsEnum(UserRole)
    role: UserRole;
}
