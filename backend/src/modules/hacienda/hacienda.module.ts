import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HaciendaService } from './hacienda.service';
import { HaciendaAuthService } from './hacienda-auth.service';
import { HaciendaXmlService } from './hacienda-xml.service';
import { HaciendaController } from './hacienda.controller';
import { OrdersModule } from '../orders/orders.module';
import { HaciendaSequence } from './entities/hacienda-sequence.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([HaciendaSequence]),
        forwardRef(() => OrdersModule)
    ],
    controllers: [HaciendaController],
    providers: [HaciendaService, HaciendaAuthService, HaciendaXmlService],
    exports: [HaciendaService, HaciendaAuthService, HaciendaXmlService],
})
export class HaciendaModule { }
