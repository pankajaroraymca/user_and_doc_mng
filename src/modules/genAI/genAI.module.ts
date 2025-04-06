import { Module } from "@nestjs/common";
import { GenAIService } from "./services/genAI.service";
import { GenAIController } from "./genAI.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GenAIEntity } from "./entities/genai-analysis.entity";
import { LoggerService } from "src/common/services/logger/logger.service";;
import { ConfigService } from "@nestjs/config";
import { CustomJwtService } from "src/common/services/jwt/jwt.service";
import { JwtService } from "@nestjs/jwt";
import { DocEntity } from "../doc/entities/doc.entity";

@Module({
    imports: [TypeOrmModule.forFeature([GenAIEntity, DocEntity])],
    exports: [],
    providers: [GenAIService, LoggerService, ConfigService, CustomJwtService, JwtService],
    controllers: [GenAIController]
})

export class GenAIModule { }