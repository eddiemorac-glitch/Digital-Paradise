import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EmergencyAppModule } from './app.module.emergency';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
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
            ? configService.get('FRONTEND_URL')
            : true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    const port = configService.get<number>('PORT') || 3000;

    await app.listen(port);

    if (useEmergencyMode) {
        console.log(`🚨 Caribe Digital Backend - EMERGENCY MODE`);
        console.log(`🚨 Database disabled - Limited functionality`);
    }

    console.log(`🚀 Caribe Digital Backend v2.0 running on: http://localhost:${port}`);
}
bootstrap();
