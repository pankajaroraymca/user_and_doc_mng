import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Env } from "../config/env.config";
import { User } from "src/modules/user/entities/user.entity";
import { DocEntity } from "src/modules/doc/entities/doc.entity";
import { GenAIEntity } from "src/modules/genAI/entities/genai-analysis.entity";


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
                entities: [
                    User,
                    DocEntity,
                    GenAIEntity
                ],
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