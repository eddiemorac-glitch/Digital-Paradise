import { Module, Global } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { PdfService } from './pdf.service';

@Global()
@Module({
    providers: [EmailsService, PdfService],
    exports: [EmailsService, PdfService],
})
export class EmailsModule { }
