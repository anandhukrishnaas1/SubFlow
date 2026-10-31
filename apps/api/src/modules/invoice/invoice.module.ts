import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PdfService } from './pdf.service';
import { InvoiceController } from './invoice.controller';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, PdfService],
  exports: [InvoiceService, PdfService],
})
export class InvoiceModule {}
