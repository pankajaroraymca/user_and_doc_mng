import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {

  constructor(
    private appService: AppService
  ) { }

  @Get('health')
  async healthCheck() {

    const data = await this.appService.getHealhCheck()
    return {
      message: 'Good Health.',
      data
    }
  }

}
