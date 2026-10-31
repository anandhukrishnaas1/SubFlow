import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';
import { Throttle } from '@nestjs/throttler';

class RegisterUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class CreateUserDto extends RegisterUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

class SetUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Post('users/:uid/role')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setRole(@Param('uid') uid: string, @Body() dto: SetUserRoleDto) {
    return this.authService.setRole(uid, dto.role);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.uid);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.createUser({
      ...dto,
      role: UserRole.CUSTOMER,
    });
  }
}
