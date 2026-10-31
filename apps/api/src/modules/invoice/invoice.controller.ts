import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { PdfService } from './pdf.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';

@Controller('invoices')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('customerId') customerId?: string,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('status') status?: string,
  ) {
    if (user.role === UserRole.CUSTOMER) {
      return this.invoiceService.findAll({ customerId: user.uid, subscriptionId, status });
    }
    return this.invoiceService.findAll({ customerId, subscriptionId, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.invoiceService.findOne(id);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice, invoice.items);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoice.number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: any) {
    return this.invoiceService.create(dto);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async confirm(@Param('id') id: string) {
    return this.invoiceService.markAsConfirmed(id);
  }

  @Patch(':id/send')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async send(@Param('id') id: string) {
    return this.invoiceService.markAsSent(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  async cancel(@Param('id') id: string) {
    return this.invoiceService.cancel(id);
  }
}
