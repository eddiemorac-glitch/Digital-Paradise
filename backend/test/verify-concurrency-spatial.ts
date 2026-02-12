
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LogisticsService } from '../src/modules/logistics/logistics.service';
import { OrderStatus } from '../src/shared/enums/order-status.enum';
import { MissionType } from '../src/shared/enums/mission-type.enum';
import { LogisticsMission } from '../src/modules/logistics/entities/logistics-mission.entity';
import { DataSource } from 'typeorm';

async function verifyConcurrencyAndSpatial() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logisticsService = app.get(LogisticsService);
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(LogisticsMission);

    console.log('--- STARTING CONCURRENCY & SPATIAL AUDIT ---');

    try {
        // 1. Setup Test Data
        const users = await dataSource.query(`SELECT id FROM users LIMIT 1`);
        if (users.length === 0) throw new Error('No users found in database to use as clientId');
        const clientId = users[0].id;

        const testMission = await repo.save(repo.create({
            clientId,
            type: MissionType.FOOD_DELIVERY,
            status: OrderStatus.READY,
            originAddress: 'Origin Test',
            originLat: 9.65,
            originLng: -82.75,
            destinationAddress: 'Dest Test',
            destinationLat: 9.66,
            destinationLng: -82.76,
            estimatedPrice: 1500,
        }));

        await dataSource.query(
            `UPDATE logistics_missions SET location = ST_GeomFromText('POINT(-82.75 9.65)', 4326)::geography WHERE id = $1`,
            [testMission.id]
        );

        console.log('Test mission created and location set.');

        // 2. Test Spatial Search
        console.log('\nTesting Spatial Search (findNearby)...');
        const nearbyMatch = await logisticsService.findNearby(9.6501, -82.7501, 500);
        console.log(`Nearby (500m): Found ${nearbyMatch.length} missions. EXPECTED: >0`);

        const nonNearby = await logisticsService.findNearby(10.0, -84.0, 1000);
        console.log(`Far away (10km): Found ${nonNearby.length} missions. EXPECTED: 0`);

        // 3. Test Concurrency (Race Condition Fix)
        console.log('\nTesting Concurrency (claimMission)...');

        let couriers = await dataSource.query(`SELECT id FROM users WHERE "courierStatus" = 'VERIFIED' LIMIT 2`);

        const createdUserIds: string[] = [];
        while (couriers.length < 2) {
            const mockId = `00000000-0000-4000-a000-${String(Date.now()).slice(-12)}`;
            await dataSource.query(
                `INSERT INTO users (id, email, "fullName", password, role, "courierStatus") VALUES ($1, $2, $3, $4, $5, $6)`,
                [mockId, `${mockId}@test.com`, `Test Courier ${couriers.length + 1}`, 'password', 'delivery', 'VERIFIED']
            );
            createdUserIds.push(mockId);
            couriers = await dataSource.query(`SELECT id FROM users WHERE "courierStatus" = 'VERIFIED' LIMIT 2`);
        }

        console.log(`Using couriers: ${couriers[0].id} and ${couriers[1].id}`);

        const p1 = logisticsService.claimMission(testMission.id, couriers[0].id);
        const p2 = logisticsService.claimMission(testMission.id, couriers[1].id);

        const results = await Promise.allSettled([p1, p2]);

        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        console.log(`Claims finished: ${fulfilled.length} SUCCESS, ${rejected.length} FAILED.`);

        if (fulfilled.length === 1) {
            console.log('✅ RACE CONDITION AUDIT PASSED: Only one courier won the race!');
        } else {
            console.error(`❌ RACE CONDITION AUDIT FAILED: Expected 1 winner, found ${fulfilled.length}`);
        }

        // Cleanup created couriers
        if (createdUserIds.length > 0) {
            await dataSource.query(`DELETE FROM users WHERE id = ANY($1)`, [createdUserIds]);
        }

        // Cleanup mission
        await repo.delete(testMission.id);
        console.log('\nCleanup done.');

    } catch (error) {
        console.error('Audit script failed:', error);
    } finally {
        await app.close();
    }
}

verifyConcurrencyAndSpatial();
