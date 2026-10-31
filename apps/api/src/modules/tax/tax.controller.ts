import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaxService } from './tax.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@subflow/shared';

@Controller('taxes')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.taxService.findAll(status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.taxService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: any) {
    return this.taxService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.taxService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.taxService.delete(id);
  }
}
