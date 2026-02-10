import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantActionLog } from './entities/merchant-action-log.entity';

@Injectable()
export class MerchantAuditService {
    constructor(
        @InjectRepository(MerchantActionLog)
        private readonly auditRepository: Repository<MerchantActionLog>,
    ) { }

    async logAction(data: {
        merchantId: string;
        adminUserId: string;
        action: string;
        reason?: string;
        previousState?: any;
        newState?: any;
    }) {
        const log = this.auditRepository.create(data);
        return await this.auditRepository.save(log);
    }

    async getLogsByMerchant(merchantId: string) {
        return await this.auditRepository.find({
            where: { merchantId },
            order: { createdAt: 'DESC' },
            relations: ['adminUser']
        });
    }
}
