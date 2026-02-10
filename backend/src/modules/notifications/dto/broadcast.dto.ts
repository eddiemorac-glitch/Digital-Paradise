import { IsString, IsIn } from 'class-validator';

export class BroadcastDto {
    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsIn(['info', 'eco', 'system', 'success', 'warning'])
    type: string;
}
