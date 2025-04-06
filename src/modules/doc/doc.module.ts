import { Module } from "@nestjs/common";
import { DocService } from "./services/doc.service";
import { DocController } from "./doc.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocEntity } from "./entities/doc.entity";
import { ConfigService } from "@nestjs/config";
import { LoggerService } from "src/common/services/logger/logger.service";
import { HelperService } from "src/common/services/helper/helper.service";

@Module({
    imports: [TypeOrmModule.forFeature([DocEntity])],
    controllers: [DocController],
    providers: [DocService, HelperService, ConfigService, LoggerService],
    exports: []
})

export class DocModule { }