import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { HaciendaService } from '../src/modules/hacienda/hacienda.service';
import { Order } from '../src/modules/orders/entities/order.entity';
import { Merchant } from '../src/modules/merchants/entities/merchant.entity';
import { DataSource } from 'typeorm';

async function verifySequence() {
    console.log('🧪 VERIFYING HACIENDA SEQUENCE HARDENING...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const haciendaService = app.get(HaciendaService);
    const dataSource = app.get(DataSource);

    const merchantId = 'test-merchant-001';

    // Create a mock order
    const mockOrder = new Order();
    mockOrder.merchantId = merchantId;
    mockOrder.merchant = { taxId: '3101123456' } as Merchant;
    mockOrder.id = 'test-order-001';

    try {
        console.log('\n[1/3] Generating first identifiers...');
        const first = await haciendaService.generateClaveAndConsecutive(mockOrder, '01');
        console.log('  ✅ Consecutive 1:', first.consecutive);
        if (!first.consecutive.endsWith('0000000001')) throw new Error('First sequence should be 1');

        console.log('\n[2/3] Generating second identifiers...');
        const second = await haciendaService.generateClaveAndConsecutive(mockOrder, '01');
        console.log('  ✅ Consecutive 2:', second.consecutive);
        if (!second.consecutive.endsWith('0000000002')) throw new Error('Second sequence should be 2');

        console.log('\n[3/3] Checking DB persistence...');
        const sequence = await dataSource.query(`SELECT "currentValue" FROM hacienda_sequences WHERE "merchantId" = $1 AND "documentType" = '01'`, [merchantId]);
        console.log('  ✅ DB Current Value:', sequence[0].currentValue);
        if (Number(sequence[0].currentValue) !== 2) throw new Error('DB value should be 2');

        console.log('\n✨ HACIENDA SEQUENCE VERIFIED SUCCESSFULLY ✨');

        // Cleanup
        await dataSource.query(`DELETE FROM hacienda_sequences WHERE "merchantId" = $1`, [merchantId]);
        console.log('🧹 Cleanup complete');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error);
    } finally {
        await app.close();
    }
}

verifySequence();
