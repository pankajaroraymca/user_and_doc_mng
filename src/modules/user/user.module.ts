import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { HelperService } from 'src/common/services/helper/helper.service';
import { LoggerService } from 'src/common/services/logger/logger.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { CustomJwtService } from 'src/common/services/jwt/jwt.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, HelperService, LoggerService, AuthService, CustomJwtService, ConfigService, JwtService],
})
export class UserModule { }
