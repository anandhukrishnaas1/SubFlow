import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() dto: any) {
    return this.authService.createUser(dto);
  }

  @Post('users/:uid/role')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setRole(@Param('uid') uid: string, @Body('role') role: string) {
    return this.authService.setRole(uid, role);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.uid);
  }

  // Public endpoint for first-time admin bootstrap or customer registration
  @Post('register')
  async register(@Body() dto: any) {
    return this.authService.createUser({
      ...dto,
      role: dto.role || UserRole.CUSTOMER,
    });
  }
}
