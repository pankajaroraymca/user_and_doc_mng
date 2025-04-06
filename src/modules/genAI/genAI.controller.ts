import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { GenAIService } from "./services/genAI.service";
import { processGenAIDto, webhookGenAIDto } from "./genAI.dto";
import { SUCCESS } from "src/common/enums/response.enum";
import { User } from "src/common/decorators/user/user.decorator";
import { Public } from "src/common/decorators/public/public.decorator";
import { UserDto } from "src/common/dto/user.dto";

@Controller('genai')
export class GenAIController {
    constructor(
        private genAIService: GenAIService
    ) { }

    @Post('process')
    /**
     * Handles the processing of GenAI requests.
     *
     * @param body - The data transfer object containing the input required for processing GenAI.
     * @param user - The user information extracted from the request context.
     * @returns An object containing a success message and the processed GenAI data.
     *
     * @throws {Error} If an error occurs during the processing of the GenAI request.
     */
    async processGenAI(@Body() body: processGenAIDto, @User() user: UserDto) {

        const data = await this.genAIService.processGenAI(body, user)

        return {
            message: SUCCESS.GENAI_REQUEST_PROCESSED_SUCCESS,
            data
        }
    }

    @Post('webhook')
    /**
     * Handles the webhook request for the GenAI service.
     *
     * @param body - The payload received from the webhook request.
     * @returns An object containing a success message and the processed data.
     */
    async webhookGenAI(@Body() body: webhookGenAIDto) {

        const data = await this.genAIService.webhookGenAI(body)

        return {
            message: SUCCESS.GENAI_WEBHOOK_PROCESSED_SUCCESSFULLY,
            data
        }
    }

    @Get(':request_id')
    /**
     * Handles the retrieval of a GenAI response based on the provided request ID.
     *
     * @param request_id - The unique identifier for the request, validated as a UUID.
     * @returns An object containing a success message and the GenAI response data.
     * 
     * @throws {BadRequestException} If the provided request ID is not a valid UUID.
     * @throws {NotFoundException} If no GenAI response is found for the given request ID.
     */
    async getGenAIResponse(@Param('request_id', new ParseUUIDPipe()) request_id: string) {

        const data = await this.genAIService.getGenAIResponse(request_id)

        return {
            message: SUCCESS.GENAI_DATA_RECEIVED_SUCCESS,
            data
        }
    }
}