import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from "./common/modules/database.module";
import { ConfigModule } from "@nestjs/config";
import { envFilePath, validationSchema } from "./common/config/env.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath,
      validationSchema: validationSchema
    }), UserModule, DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService]
})

export class AppModule { }