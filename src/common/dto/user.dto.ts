import { USER_ROLES } from "../enums/database.enum";

export class UserDto {
    userId: string;
    email: string;
    name: string;
    token: string;
    role: USER_ROLES
  }
  