import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { Env } from "./common/config/env.config";
import { BadRequestException, ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  app.setGlobalPrefix('v1/api');

  const origin = configService.get(Env.ALLOW_ORIGIN).split(',') ?? [];
  app.enableCors({
    origin: origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });


  function extractErrorMessage(error) {
    // Base case: Check for constraints in the current error
    if (error.constraints) {
      return Object.values(error.constraints)[0]; // Return the first constraint message
    }

    // Recursive case: Check if there are any nested errors
    if (error.children && error.children.length > 0) {
      for (const child of error.children) {
        const message = extractErrorMessage(child); // Recursively extract from children
        if (message) {
          return message; // Return the first valid message found
        }
      }
    }

    return `Validation failed for property ${error.property}`; // Default message if no constraints found
  }

  // Configure the global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: true,
      exceptionFactory(errors) {
        const error = errors[0]; // Take the first validation error
        const message = extractErrorMessage(error); // Extract the exact error message
        throw new BadRequestException(message);
      },
    }),
  );

  await app.listen(configService.get(Env.PORT), ()=>{
    console.log(`Server running on http://localhost:${configService.get(Env.PORT)}`);
  })

}

bootstrap()