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
import { ProductService } from './product.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@subflow/shared';

@Controller('products')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.productService.findAll(status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: any) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async archive(@Param('id') id: string) {
    return this.productService.archive(id);
  }
}
