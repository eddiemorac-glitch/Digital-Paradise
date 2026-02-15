import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase18Hardening1770941539387 implements MigrationInterface {
    name = 'Phase18Hardening1770941539387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "hacienda_sequences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "merchantId" character varying NOT NULL, "documentType" character varying(2) NOT NULL, "terminal" character varying(3) NOT NULL DEFAULT '001', "puntoVenta" character varying(5) NOT NULL DEFAULT '00001', "currentValue" bigint NOT NULL DEFAULT '1', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_hacienda_sequences_unique" UNIQUE ("merchantId", "documentType", "terminal", "puntoVenta"), CONSTRAINT "PK_hacienda_sequences_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hacienda_sequences_merchantId" ON "hacienda_sequences" ("merchantId")`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "webhook_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying NOT NULL, "payload" text NOT NULL, "orderId" character varying, "status" character varying NOT NULL DEFAULT 'PENDING', "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c41f6cdf59cdfe3704807650896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_54cf80d17d0fc4777d3c46f76b" ON "webhook_logs" ("provider") `);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sessions" ("expiredAt" bigint NOT NULL, "id" character varying(255) NOT NULL, "json" text NOT NULL, "destroyedAt" TIMESTAMP, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4c1989542e47d9e3b98fe32c67" ON "sessions" ("expiredAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_4b2bf18167e94dce386d714c67" ON "users" ("fullName") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_1e3d0240b49c40521aaeb95329" ON "users" ("phoneNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1ead5676ec405db6f946817da" ON "users" ("courierStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_4c9fb58de893725258746385e1" ON "products" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_9cabac6d8bc37cae80163196a1" ON "products" ("isAvailable") `);
        await queryRunner.query(`CREATE INDEX "IDX_c3932231d2385ac248d0888d95" ON "products" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_561285a7c09aa749e7da74706c" ON "products" ("cabysCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_7139c20741319eaa68e7fac20e" ON "products" ("merchantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f125672f13f9d234c6696db220" ON "merchants" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_7f84b6e8b5c5b767641f12fc43" ON "merchants" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_84f1d5ba14e3d8ec381d885248" ON "merchants" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_d930f10be0b46fea25d93d2bca" ON "merchants" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_b1c476d3c6903e4db115bc649d" ON "merchants" ("isSustainable") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e04c437e9e88358af2340dae8" ON "logistics_missions" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7e04c437e9e88358af2340dae8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1c476d3c6903e4db115bc649d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d930f10be0b46fea25d93d2bca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84f1d5ba14e3d8ec381d885248"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f84b6e8b5c5b767641f12fc43"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f125672f13f9d234c6696db220"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7139c20741319eaa68e7fac20e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_561285a7c09aa749e7da74706c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3932231d2385ac248d0888d95"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9cabac6d8bc37cae80163196a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c9fb58de893725258746385e1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1ead5676ec405db6f946817da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e3d0240b49c40521aaeb95329"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4b2bf18167e94dce386d714c67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c1989542e47d9e3b98fe32c67"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54cf80d17d0fc4777d3c46f76b"`);
        await queryRunner.query(`DROP TABLE "webhook_logs"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_hacienda_sequences_merchantId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "hacienda_sequences"`);
    }

}
