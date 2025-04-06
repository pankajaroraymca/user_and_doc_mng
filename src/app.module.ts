import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from "./common/modules/database.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { envFilePath, validationSchema } from "./common/config/env.config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AuthGuard } from "./common/guards/auth/auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { HelperService } from "./common/services/helper/helper.service";
import { JwtService } from "@nestjs/jwt";
import { CustomJwtService } from "./common/services/jwt/jwt.service";
import { LoggingInterceptor } from "./common/interceptors/logger/logger.interceptor";
import { ResponseInterceptor } from "./common/interceptors/response/response.interceptor";
import { LoggerService } from "./common/services/logger/logger.service";
import { DocModule } from "./modules/doc/doc.module";
import { GenAIModule } from "./modules/genAI/genAI.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath,
      validationSchema: validationSchema
    }),
    UserModule,
    DatabaseModule,
    AuthModule,
    DocModule,
    GenAIModule
  ],
  controllers: [AppController],
  providers: [AppService,
    JwtService,
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    HelperService
  ]
})

export class AppModule { }