import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealhCheck: jest.fn().mockResolvedValue({
              status: 200,
              message: "Health check passed",
            }),
          },
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
    appService = moduleRef.get<AppService>(AppService);
  });

  it("should be defined", () => {
    expect(appController).toBeDefined();
  });

  it("should return health check response", async () => {
    const result = await appController.healthCheck();
    expect(result).toEqual({
      message: "Good Health.",
      data: {
        status: 200,
        message: "Health check passed",
      },
    });
  });

  it("should call getHealhCheck from AppService", async () => {
    await appController.healthCheck();
    expect(appService.getHealhCheck).toHaveBeenCalled();
  });
});
