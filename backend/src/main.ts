import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { EmergencyAppModule } from './app.module.emergency';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from './config/typeorm.config';

async function bootstrap() {
    // BOOTSTRAP: Ensure PostGIS extension exists before TypeORM syncs entities
    try {
        console.log('PostGIS Bootstrap: Connecting to database to ensure extensions...');
        const ds = new DataSource({
            ...(typeOrmConfig as any),
            synchronize: false, // Don't sync yet, we just want the extension
            migrationsRun: false,
        });
        await ds.initialize();
        await ds.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        console.log('PostGIS Bootstrap: Extension verified/created successfully.');
        await ds.destroy();
    } catch (error) {
        console.error('PostGIS Bootstrap Error:', error.message);
        // We don't exit here; let the main app try to start anyway
    }

    const useEmergencyMode = process.env.EMERGENCY_MODE === 'true';

    const app = await NestFactory.create<NestExpressApplication>(
        useEmergencyMode ? EmergencyAppModule : AppModule,
        {
            rawBody: true,
        }
    );

    const configService = app.get(ConfigService);
    app.setGlobalPrefix('api');

    // Increase body limit to 50mb
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    // Enable Gzip compression
    app.use(require('compression')());

    // Enable Helmet for Security Headers
    app.use(require('helmet')());

    // Swagger - Enabled in Development OR if explicitly allowed in Production
    if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
        const config = new DocumentBuilder()
            .setTitle('DIGITAL PARADISE API')
            .setDescription('Centro de Comando Caribe - Puerto Viejo Digital Ecosystem')
            .setVersion('2.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    // Global Request Logger (Development Only)
    if (process.env.NODE_ENV !== 'production') {
        app.use((req, res, next) => {
            console.log(`[REQUEST] ${req.method} ${req.url}`);
            next();
        });
    }

    // Use Winston for all system logs
    try {
        const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
        if (logger) app.useLogger(logger);
    } catch (e) {
        // Fallback to default Nest logger
    }

    // Enable global validation pipes
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Use global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Enable CORS
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? [
                configService.get('FRONTEND_URL'),
                /\.vercel\.app$/,
            ]
            : true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    const port = configService.get<number>('PORT') || 3001;

    await app.listen(port, '0.0.0.0');

    if (useEmergencyMode) {
        console.log(`🚨 Caribe Digital Backend - EMERGENCY MODE`);
        console.log(`🚨 Database disabled - Limited functionality`);
    }

    console.log(`🚀 Caribe Digital Backend v2.0 running on: http://localhost:${port}`);
}
bootstrap();
