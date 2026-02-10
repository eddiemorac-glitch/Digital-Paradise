import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class LegalService {
    private readonly logger = new Logger(LegalService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly emailsService: EmailsService,
    ) { }

    async handleArcoRequest(userId: string, type: 'ACCESS' | 'RECTIFICATION' | 'CANCELLATION' | 'OPPOSITION', details: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return;

        this.logger.log(`ARCO Request received from ${user.email}: ${type}`);

        // In a real system, this would create a ticket or record in a special "Compliance" table
        // For now, we notify the admin and the user
        await this.emailsService.sendEmail(
            'admin@caribedigital.cr',
            `Solicitud ARCO - ${type} - ${user.email}`,
            `<p>El usuario ${user.fullName} (${user.email}) ha solicitado un derecho ARCO de tipo: <strong>${type}</strong>.</p>
             <p>Detalles: ${details}</p>`
        );

        return { message: 'Solicitud recibida. Procesaremos su requerimiento en un máximo de 10 días hábiles.' };
    }
}
