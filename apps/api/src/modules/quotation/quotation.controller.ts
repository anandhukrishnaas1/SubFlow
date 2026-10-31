import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';

@Controller('quotations')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    if (user.role === UserRole.CUSTOMER) {
      return this.quotationService.findAll({ customerId: user.uid, status });
    }
    return this.quotationService.findAll({ customerId, status });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const quotation = await this.quotationService.findOne(id);
    this.assertOwner(quotation, user);
    return quotation;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: any, @CurrentUser('uid') userId: string) {
    return this.quotationService.create(dto, userId);
  }

  @Patch(':id/send')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async send(@Param('id') id: string) {
    return this.quotationService.send(id);
  }

  @Patch(':id/accept')
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOwner(await this.quotationService.findOne(id), user);
    return this.quotationService.accept(id);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOwner(await this.quotationService.findOne(id), user);
    return this.quotationService.reject(id, reason);
  }

  private assertOwner(
    resource: { customerId?: string },
    user: AuthenticatedUser,
  ): void {
    if (user.role === UserRole.CUSTOMER && resource.customerId !== user.uid) {
      throw new NotFoundException('Quotation not found');
    }
  }
}
