
import { IsDefined, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { Transform } from "class-transformer";
import { IntersectionType } from '@nestjs/mapped-types';


export class DocChunkUploadBodyDto {

    @IsUUID()
    @IsNotEmpty()
    unified_id: string;

}

export class DocChunkUploadHeadersDto {

    @Transform(({ value }) => Number(value))
    @IsDefined()
    "file-size": number;

    @IsString()
    @IsNotEmpty()
    "file-name": string;

    @IsString()
    @IsNotEmpty()
    "actual-file-name": string;

    @Transform(({ value }) => Number(value))
    @IsDefined()
    "chunk-index": number;

    @Transform(({ value }) => Number(value))
    @IsDefined()
    "total-chunks": number;

}

export class CombinedDocUploadDto extends IntersectionType(DocChunkUploadBodyDto, DocChunkUploadHeadersDto) { }