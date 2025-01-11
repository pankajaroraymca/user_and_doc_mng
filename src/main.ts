import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { Env } from "./common/config/env.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  await app.listen(configService.get(Env.PORT))

  console.log(`Server running on http://localhost:${configService.get(Env.PORT)}`);

}

bootstrap()