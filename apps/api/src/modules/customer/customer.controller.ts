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
import { CustomerService } from './customer.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';

@Controller('customers')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.customerService.findAll({ search, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    // Customers can view only their own record
    if (user.role === UserRole.CUSTOMER && user.uid !== id) {
      return this.customerService.findOne(user.uid);
    }
    return this.customerService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: any, @CurrentUser('uid') userId: string) {
    return this.customerService.create(dto, userId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.customerService.delete(id);
  }
}
