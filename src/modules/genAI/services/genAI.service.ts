import { BadRequestException, HttpStatus, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Not, Repository } from "typeorm";
import { LoggerService } from "src/common/services/logger/logger.service";
import { processGenAIDto, webhookGenAIDto } from "../genAI.dto";
import { FILE_UPLOAD_STATUS, GENAI_ANALYSIS_STATUS } from "src/common/enums/database.enum";
import { LOGS_ENUM } from "src/common/enums/logs.enum";
import { ConfigService } from "@nestjs/config";
import { CustomJwtService } from "src/common/services/jwt/jwt.service";
import { Env } from "src/common/config/env.config";
import { BaseService } from "src/common/services/base/base.service";
import AxiosHelper from "src/common/services/axios/generic.axios.service";
import { UserDto } from "src/common/dto/user.dto";
import { DocEntity } from "src/modules/doc/entities/doc.entity";
import { ERROR } from "src/common/enums/response.enum";
import { GenAIEntity } from "../entities/genai-analysis.entity";

@Injectable()
export class GenAIService extends BaseService<GenAIEntity> {
    constructor(
        @InjectRepository(GenAIEntity)
        private genAIResposiotry: Repository<GenAIEntity>,
        @InjectRepository(DocEntity)
        private docResposiotry: Repository<DocEntity>,
        @InjectEntityManager() readonly entityManager: EntityManager,
        private loggerService: LoggerService,
        private configService: ConfigService,
        private jwtService: CustomJwtService,
    ) {
        super(genAIResposiotry, loggerService)
    }

    axiosClient = new AxiosHelper(this.configService.get(Env.DS_BASE_URL))

    
    /**
     * Processes a GenAI request by validating the input, checking for existing records, 
     * and interacting with an external API to initiate the GenAI analysis process.
     * 
     * @param body - The data transfer object containing the request details for processing GenAI.
     * @param user - The user information object containing details of the user making the request.
     * 
     * @throws {BadRequestException} If the required document data is insufficient or 
     * if the GenAI request fails during the API call.
     * 
     * @returns A promise resolving to the existing GenAI data if the request is already processed, 
     * or the newly created GenAI entity data after initiating the process.
     * 
     * The method performs the following steps:
     * 1. Logs the start of the GenAI process.
     * 2. Checks if a GenAI request with the same `request_id` is already in a pending or success state.
     * 3. Validates the existence of the associated document data in the repository.
     * 4. Constructs the payload for the GenAI API and creates a database entity with a pending status.
     * 5. Sends the request to the external GenAI API and updates the status based on the response.
     * 6. Logs the success or failure of the process and updates the database entity accordingly.
     */
    async processGenAI(body: processGenAIDto, user: UserDto) {

        this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_STARTED, { request_id: body.request_id })
        const isGenAIDataExist = await this.findOne({ where: { request_id: body.request_id, status: Not(GENAI_ANALYSIS_STATUS.FAIL) }, select: ['id', 'request', 'response', 'status', 'request_id'] })

        // IF REQUEST IS ALREADY IN PENDING/SUCCESS STATE
        if (isGenAIDataExist && [GENAI_ANALYSIS_STATUS.PENDING, GENAI_ANALYSIS_STATUS.ACK, GENAI_ANALYSIS_STATUS.SUCCESS].includes(isGenAIDataExist.status)) {
            this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_ALREADY_PROCESSED, { request_id: body.request_id })
            return isGenAIDataExist
        }

        const docData = await this.docResposiotry.findOne({
            where: { unified_id: body.request_id, status: FILE_UPLOAD_STATUS.ACTIVE },
        });

        if (!docData) {
            this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_DATA_NOT_SUFFIECIENT, { request_id: body.request_id })
            throw new BadRequestException(ERROR.GENAI_REQUEST_PROCESSED_DATA_INSUFFICIENT)
        }

        // GENERATE PAYLOAD FOR GENAI API -- DS TEAM API
        const genAIApiPayload = {
            user_id: docData.owner,
            request_id: body.request_id,
            file_path: docData.file_path, // IT SHOULD BE THE CLOUD STORAGE PATH SO THAT DS TEAM CAN PROCESS THE FILE, BUT AS OF NOW IT IS LOCAL PATH
        }

        // GENERATE DB ENTITY DATA
        let genAIEntityData = {
            request_id: body.request_id,
            request: JSON.stringify(genAIApiPayload),
            response: null,
            status: GENAI_ANALYSIS_STATUS.PENDING,
        }

        const savedEntityData = await this.create(genAIEntityData)
        this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_INITAL_RECORD_SAVED, { request_id: body.request_id })

        /*
        * THIS IS THE ACK API, WHICH WILL SEND THE REQUEST TO DS TEAM
        * IF THE REQUEST IS SUCCESSFULLY SENT THEN WE WILL UPDATE THE STATUS TO ACK
        * IF THE REQUEST IS FAILED THEN WE WILL UPDATE THE STATUS TO FAIL - RIGHT NOW REQUEST IS MOCKED TO n8n Tool
        * AFTER DS TEAM HAS PROCESSED THE REQUEST, THEY WILL SEND THE WEBHOOK TO UPDATE THE STATUS AND DATA
        */
        try {

            const response: any = await this.axiosClient.post('process', genAIApiPayload, {
                headers: {
                    'Authorization': `Bearer ${this.getJwtAccessToken(user)}`
                }
            })
            this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_API_CALL_SENT, { request_id: body.request_id, response })

            if (response.code == HttpStatus.OK) {
                this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_API_CALL_SUCCESS, { request_id: body.request_id })
                genAIEntityData.status = GENAI_ANALYSIS_STATUS.ACK

                // SEND EVENT TO USER
            }
        } catch (error) {
            this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_API_CALL_ERROR, { request_id: body.request_id, errorMessage: error.message })
            genAIEntityData.status = GENAI_ANALYSIS_STATUS.FAIL
            genAIEntityData.response = JSON.stringify({ error, errorMessage: error.message })
        }

        await this.update(savedEntityData.id, genAIEntityData)

        if (genAIEntityData.status != GENAI_ANALYSIS_STATUS.ACK) {
            this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_FAIL, { request_id: body.request_id })
            throw new BadRequestException(ERROR.GENAI_REQUEST_FAILED)
        }
        this.loggerService.log(LOGS_ENUM.GENAI_PROCESS_SUCCESS, { request_id: body.request_id })
    }

    /**
     * Handles the webhook callback for GenAI processing.
     *
     * This method processes the incoming webhook payload, validates the request,
     * updates the database with the response, and logs the appropriate events.
     *
     * @param body - The payload received from the webhook. It contains the following properties:
     *   - `request_id`: A unique identifier for the GenAI request.
     *   - `status`: The current status of the GenAI analysis.
     *   - `response`: The response data from the GenAI service (optional).
     *
     * @throws {BadRequestException} If the request with the given `request_id` is not found
     * or if the status is invalid.
     *
     * @returns A promise that resolves to the updated entity data after processing the webhook.
     */
    async webhookGenAI(body: webhookGenAIDto) {

        this.loggerService.log(LOGS_ENUM.GENAI_WEBHOOK_STARTED, { requestId: body.request_id, status: body?.status ?? "" })
        const isGenAIDataExist = await this.findOne({ where: { request_id: body.request_id, status: Not(GENAI_ANALYSIS_STATUS.FAIL) }, select: ['id', 'request', 'response', 'status', 'request_id'] })

        // REQUEST SHOULD BE ACK
        if (!isGenAIDataExist) {
            this.loggerService.log(LOGS_ENUM.GENAI_WEBHOOK_REQUEST_NOT_FOUND, { requestId: body.request_id })
            throw new BadRequestException('Request not found')
        }

        // WEBHOOK IS ALREADY RECEIVED
        if (isGenAIDataExist.status == GENAI_ANALYSIS_STATUS.SUCCESS) {
            this.loggerService.log(LOGS_ENUM.GENAI_WEBHOOK_ALREADY_SUCCESS, { requestId: body.request_id })
            return isGenAIDataExist
        }

        // UPDATE WEBHOOK RESPONSE FOR PENDING, ACK STATUS
        const updatedEntityData = { ...isGenAIDataExist, response: body.response, status: body.status }
        await this.update(isGenAIDataExist.id, updatedEntityData)

        this.loggerService.log(LOGS_ENUM.GENAI_WEBHOOK_SUCCESS, { requestId: body.request_id, status: body?.status ?? "" })

        return updatedEntityData
    }

    /**
     * Retrieves the GenAI response for a given request ID.
     *
     * @param {string} requestId - The ID of the request to retrieve the GenAI response for.
     * @returns {Promise<object>} The GenAI response along with associated file metadata.
     * @throws {BadRequestException} If the request ID is not found or is invalid.
     */
    async getGenAIResponse(requestId: string) {

        // CHECK REQUEST ID IS VALID OR NOT
        const isRequestValid = await this.findOne({ where: { request_id: requestId, status: GENAI_ANALYSIS_STATUS.SUCCESS }, select: ['request_id', 'response', 'status'] })

        if (!isRequestValid) {
            throw new BadRequestException('Request not found')
        }

        const fileMetadata = await this.docResposiotry.find({ where: { unified_id: requestId, status: FILE_UPLOAD_STATUS.ACTIVE }, select: ['file_name', 'actual_file_name', 'file_path', 'file_size', 'file_type', 'created_at'] })

        return { ...isRequestValid, file_metadata: fileMetadata }

    }

    /**
     * Generates a JWT access token for the given user.
     *
     * @param {UserDto} user - The user data transfer object containing user details.
     * @returns {Promise<string>} A promise that resolves to the signed JWT access token.
     */
    getJwtAccessToken(user: UserDto) {
        const payload = {
            "userId": user.userId,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        }

        return this.jwtService.sign(payload)
    }
}