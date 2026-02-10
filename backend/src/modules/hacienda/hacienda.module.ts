import { Module, forwardRef } from '@nestjs/common';
import { HaciendaService } from './hacienda.service';
import { HaciendaAuthService } from './hacienda-auth.service';
import { HaciendaXmlService } from './hacienda-xml.service';
import { HaciendaController } from './hacienda.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [forwardRef(() => OrdersModule)],
    controllers: [HaciendaController],
    providers: [HaciendaService, HaciendaAuthService, HaciendaXmlService],
    exports: [HaciendaService, HaciendaAuthService, HaciendaXmlService],
})
export class HaciendaModule { }
