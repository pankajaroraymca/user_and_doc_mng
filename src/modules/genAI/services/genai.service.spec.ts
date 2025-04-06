import { Test, TestingModule } from "@nestjs/testing";
import { Repository, EntityManager } from "typeorm";
import { getRepositoryToken, getEntityManagerToken } from "@nestjs/typeorm";
import { LoggerService } from "src/common/services/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import { CustomJwtService } from "src/common/services/jwt/jwt.service";
import { DocEntity } from "src/modules/doc/entities/doc.entity";
import { GenAIEntity } from "../entities/genai-analysis.entity";
import { processGenAIDto, webhookGenAIDto } from "../genAI.dto";
import { BadRequestException } from "@nestjs/common";
import { UserDto } from "src/common/dto/user.dto";
import { FILE_UPLOAD_STATUS, GENAI_ANALYSIS_STATUS, USER_ROLES } from "src/common/enums/database.enum";
import { ERROR } from "src/common/enums/response.enum";
import { GenAIService } from "./genAI.service";

describe("GenAIService", () => {
    let genAIService: GenAIService;
    let genAIRepository: Repository<GenAIEntity>;
    let docRepository: Repository<DocEntity>;
    let entityManager: EntityManager;
    let loggerService: LoggerService;

    beforeEach(async () => {

        const mockGenAIRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        };

        const mockDocRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GenAIService,
                {
                    provide: getRepositoryToken(GenAIEntity),
                    useValue: mockGenAIRepository,
                },
                {
                    provide: getRepositoryToken(DocEntity),
                    useValue: mockDocRepository,
                },
                {
                    provide: getEntityManagerToken(),
                    useClass: EntityManager,
                },
                {
                    provide: LoggerService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: CustomJwtService,
                    useValue: {
                        sign: jest.fn(() => "mocked-jwt-token"),
                    },
                }
            ],
        }).compile();

        genAIService = module.get<GenAIService>(GenAIService);
        genAIRepository = module.get<Repository<GenAIEntity>>(getRepositoryToken(GenAIEntity));
        docRepository = module.get<Repository<DocEntity>>(getRepositoryToken(DocEntity));
        entityManager = module.get<EntityManager>(getEntityManagerToken());
        loggerService = module.get<LoggerService>(LoggerService);
    });

    const mockUser: UserDto = {
        userId: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: USER_ROLES.ADMIN,
        token: "mocked-jwt-token",
    };

    const mockRequest: processGenAIDto = {
        request_id: "req-123",
    };

    const mockDocEntity: DocEntity = {
        unified_id: "req-123",
        owner: "user-123",
        file_path: "/dummy/path",
        status: FILE_UPLOAD_STATUS.ACTIVE,
    } as DocEntity;

    const mockGenAIEntity = new GenAIEntity();
    Object.assign(mockGenAIEntity, {
        request_id: "req-123",
        request: JSON.stringify(mockRequest),
        response: null,
        status: GENAI_ANALYSIS_STATUS.PENDING,
        doc_relation: [],
        id: "mock-id",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    

    describe("processGenAI", () => {

       
        it("should throw BadRequestException if document data is not found", async () => {
            jest.spyOn(docRepository, "findOne").mockResolvedValue(null);

            await expect(genAIService.processGenAI(mockRequest, mockUser)).rejects.toThrow(
                new BadRequestException(ERROR.GENAI_REQUEST_PROCESSED_DATA_INSUFFICIENT)
            );
        });

        it("should update the status to FAIL when external API call fails", async () => {
            jest.spyOn(docRepository, "findOne").mockResolvedValue(mockDocEntity);
            jest.spyOn(genAIRepository, "findOne").mockResolvedValue(null);
            jest.spyOn(genAIRepository, "save").mockResolvedValue(mockGenAIEntity);
            jest.spyOn(loggerService, "log");
            
            await expect(genAIService.processGenAI(mockRequest, mockUser)).rejects.toThrow(
                new BadRequestException(ERROR.GENAI_REQUEST_FAILED)
            );
        });

        it("should return existing GenAI entity if already in process", async () => {
            jest
                .spyOn(genAIRepository, "findOne")
                .mockResolvedValue(mockGenAIEntity);

            const result = await genAIService.processGenAI(mockRequest, mockUser);
            expect(result).toEqual(expect.objectContaining({ status: GENAI_ANALYSIS_STATUS.PENDING }));
        });
    });

    describe("webhookGenAI", () => {

        const mockWebhookData: webhookGenAIDto = {
            request_id: "req-123",
            response: { data: "some-response" },
            status: GENAI_ANALYSIS_STATUS.SUCCESS,
            message: "Analysis completed successfully",
        };

        it("should throw BadRequestException if request is not found", async () => {
            jest.spyOn(genAIRepository, "findOne").mockResolvedValue(null);

            await expect(genAIService.webhookGenAI(mockWebhookData)).rejects.toThrow(BadRequestException);
        });

        it("should return existing data if already successful", async () => {

            const updatedMockGenAIEntity = Object.assign({}, mockGenAIEntity, { status: GENAI_ANALYSIS_STATUS.SUCCESS });
            jest
                .spyOn(genAIRepository, "findOne")
                .mockResolvedValue(updatedMockGenAIEntity);

            const result = await genAIService.webhookGenAI(mockWebhookData);
            expect(result.status).toEqual(GENAI_ANALYSIS_STATUS.SUCCESS);
        });

        it("should update the GenAI entity with webhook response", async () => {

            jest.spyOn(genAIRepository, "findOne").mockResolvedValue(mockGenAIEntity);

            const updatedMockGenAIEntity = Object.assign({}, mockGenAIEntity, { status: mockWebhookData.status, response: mockWebhookData.response });
            jest.spyOn(genAIRepository, "save").mockResolvedValue(updatedMockGenAIEntity);

            const result = await genAIService.webhookGenAI(mockWebhookData);

            expect(result.status).toEqual(mockWebhookData.status);
            expect(result.response).toEqual(mockWebhookData.response);
        });
    });

    describe("getGenAIResponse", () => {

        const mockResponseData = new GenAIEntity();
        Object.assign(mockResponseData, {
            request_id: "req-123",
            request: JSON.stringify(mockRequest),
            response: { data: "AI response" },
            status: GENAI_ANALYSIS_STATUS.SUCCESS,
            doc_relation: [],
            id: "mock-id",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        const mockDocData = new DocEntity();
        Object.assign(mockDocData, {
            unified_id: "req-123",
            file_name: "test.pdf",
            actual_file_name: "test_actual.pdf",
            file_path: "/dummy/path",
            file_size: 12345,
            file_type: "pdf",
            created_at: new Date(),
        });



        const mockFileMetadata = [mockDocData];

        it("should throw BadRequestException if request ID is not found", async () => {
            jest.spyOn(genAIRepository, "findOne").mockResolvedValue(null);

            await expect(genAIService.getGenAIResponse("req-123")).rejects.toThrow(BadRequestException);
        });

        it("should return GenAI response and file metadata", async () => {
            jest.spyOn(genAIRepository, "findOne").mockResolvedValue(mockResponseData);
            jest.spyOn(docRepository, "find").mockResolvedValue(mockFileMetadata);

            const result = await genAIService.getGenAIResponse("req-123");

            expect(result.response).toEqual(mockResponseData.response);
            expect(result.file_metadata).toEqual(mockFileMetadata);
        });
    });
});
