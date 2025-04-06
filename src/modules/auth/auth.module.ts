import { forwardRef, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserService } from "../user/user.service";
import { UserModule } from "../user/user.module";
import { CustomJwtService } from "src/common/services/jwt/jwt.service";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/entities/user.entity";
import { HelperService } from "src/common/services/helper/helper.service";
import { LoggerService } from "src/common/services/logger/logger.service";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AuthController],
    providers: [AuthService, CustomJwtService, UserService, ConfigService, JwtService, HelperService, LoggerService],
    exports: []
})

export class AuthModule { }