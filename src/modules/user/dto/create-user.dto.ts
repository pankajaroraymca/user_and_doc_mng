import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MIN_LENGTH, MinLength } from "class-validator";
import { REGEX } from "src/common/constants/common.constants";
import { COUNTRY_CODES, USER_ROLES } from "src/common/enums/database.enum";
import { ERROR } from "src/common/enums/response.enum";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Matches(REGEX.FIRST_NAME, { message: ERROR.FIRST_NAME_REGEX_ERROR })
    first_name: string

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @IsOptional()
    @Matches(REGEX.LAST_NAME, { message: ERROR.LAST_NAME_REGEX_ERROR })
    last_name: string

    @IsString()
    @IsNotEmpty()
    @Matches(REGEX.USERNAME, { message: ERROR.USERNAME_REGEX_ERROR })
    username: string;

    @IsEmail({}, { message: ERROR.EMAIL_NUMBER_REGEX_ERROR })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Matches(REGEX.PASSWORD, { message: ERROR.PASSWORD_REGEX_ERROR })
    password: string;

    @IsString()
    @IsNotEmpty()
    @Matches(REGEX.MOBILE_NUMBER, { message: ERROR.MOBILE_NUMBER_REGEX_ERROR })
    mobile_number: string;

    @IsEnum(COUNTRY_CODES, { message: ERROR.COUNTRY_CODE_ERROR })
    country_code: COUNTRY_CODES;

    @IsEnum(USER_ROLES, { message: ERROR.USER_ROLE_ERROR })
    @IsNotEmpty()
    role: USER_ROLES;
}
