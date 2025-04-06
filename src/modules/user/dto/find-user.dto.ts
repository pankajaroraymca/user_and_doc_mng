import { BadRequestException } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class FindUserWithCustomIdsDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  constructor(partial: Partial<FindUserWithCustomIdsDto>) {
    Object.assign(this, partial);
    if (!this.email && !this.mobile_number && !this.username) {
      throw new BadRequestException("At least one field (email, mobile, or username) is required");
    }
  }
}