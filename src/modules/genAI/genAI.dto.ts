import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID} from "class-validator";
import { GENAI_ANALYSIS_STATUS } from "src/common/enums/database.enum";

export class processGenAIDto {

    @IsUUID()
    request_id: string
}



export class webhookGenAIDto {

    @IsUUID()
    request_id: string

    @IsEnum(GENAI_ANALYSIS_STATUS)
    status: GENAI_ANALYSIS_STATUS

    @IsOptional()
    @IsString()
    message: string

    @IsObject()
    response: any
}