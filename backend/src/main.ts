import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EmergencyAppModule } from './app.module.emergency';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { typeOrmConfig } from './config/typeorm.config';
import { URL } from 'url';

async function bootstrap() {
    console.error('DEBUG: STARTING APP STARTUP SEQUENCE');
    if (process.env.DATABASE_URL) {
        try {
            const dbUrl = new URL(process.env.DATABASE_URL);
            console.error(`DEBUG: DATABASE_URL Hostname: ${dbUrl.hostname}`);
            console.error(`DEBUG: TypeORM SSL Config: ${JSON.stringify((typeOrmConfig as any).ssl)}`);
            console.error(`DEBUG: TypeORM Extra Config: ${JSON.stringify((typeOrmConfig as any).extra)}`);
        } catch (e) {
            console.error('DEBUG: Error parsing DATABASE_URL:', e);
        }
    } else {
        console.error('DEBUG: NO DATABASE_URL environment variable found!');
    }

    // Force crash to ensure logs are seen before any async stuff swallows them
    // throw new Error('DEBUG CRASH: INTENTIONAL CRASH TO REVEAL LOGS');

    const useEmergencyMode = process.env.EMERGENCY_MODE === 'true';

    const app = await NestFactory.create<NestExpressApplication>(
        useEmergencyMode ? EmergencyAppModule : AppModule,
        {
            rawBody: true,
        }
    );

    const configService = app.get(ConfigService);
    app.setGlobalPrefix('api');

    // Swagger - only available in development
    if (process.env.NODE_ENV !== 'production') {
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
