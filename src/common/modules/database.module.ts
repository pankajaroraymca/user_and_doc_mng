import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Env } from "../config/env.config";


@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get(Env.POSTGRES_HOST),
                port: configService.get(Env.POSTGRES_PORT),
                database: configService.get(Env.POSTGRES_DATABASE),
                username: configService.get(Env.POSTGRES_USERNAME),
                password: configService.get(Env.POSTGRES_PASSWORD),
                schema: configService.get(Env.POSTGRES_SCHEMA),
                entities: [],
                synchronize: configService.get(Env.POSTGRES_SYNC),
                ssl: configService.get(Env.POSTGRES_SSL),
                logger: 'file',
                logging: true,
            }),
            inject: [ConfigService]
        })
    ]
})


export class DatabaseModule { }