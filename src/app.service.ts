import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {

  async getHealhCheck() {
    return {
      status: 200,
      message: "Health check passed"
    }
  }
}