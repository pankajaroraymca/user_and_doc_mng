import { Test, TestingModule } from "@nestjs/testing";
import { AppService } from "./app.service";

describe("AppService", () => {
  let appService: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    appService = moduleRef.get<AppService>(AppService);
  });

  it("should be defined", () => {
    expect(appService).toBeDefined();
  });

  it("should return a valid health check response", async () => {
    const result = await appService.getHealhCheck();
    expect(result).toEqual({
      status: 200,
      message: "Health check passed",
    });
  });
});
