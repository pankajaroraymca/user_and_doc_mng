import { PartialType } from "@nestjs/mapped-types"
import { IsString } from "class-validator"
import { FindUserWithCustomIdsDto } from "src/modules/user/dto/find-user.dto"

export class SignInDto extends PartialType(FindUserWithCustomIdsDto) {

    @IsString()
    password: string
}