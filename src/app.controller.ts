import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public/public.decorator";

@Controller()
export class AppController {

  constructor(
    private appService: AppService
  ) { }

  @Public()
  @Get('health')
  async healthCheck() {

    const data = await this.appService.getHealhCheck()
    return {
      message: 'Good Health.',
      data
    }
  }

}
