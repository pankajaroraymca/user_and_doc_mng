import { Type } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MIN_LENGTH, MinLength, registerDecorator, ValidationOptions, ValidationArguments, ValidateIf, IsArray, ValidateNested } from "class-validator";
import { REGEX } from "src/common/constants/common.constants";
import { USER_ROLES } from "src/common/enums/database.enum";
import { ERROR } from "src/common/enums/response.enum";


export function AtLeastOneField(fields: string[], validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'atLeastOneField',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const dtoObject = args.object as any;
                    return fields.some(field => dtoObject[field]);
                },
                defaultMessage(): string {
                    return 'At least one of email or mobile_number must be provided';
                },
            },
        });
    };
}

export class UserBaseDto {
    
    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(100)
    @Matches(REGEX.FIRST_NAME, { message: ERROR.FIRST_NAME_REGEX_ERROR })
    first_name?: string

    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(100)
    @IsOptional()
    @Matches(REGEX.LAST_NAME, { message: ERROR.LAST_NAME_REGEX_ERROR })
    last_name?: string

    @IsString()
    @IsOptional()
    @Matches(REGEX.USERNAME, { message: ERROR.USERNAME_REGEX_ERROR })
    username: string;

    @IsEmail({}, { message: ERROR.EMAIL_NUMBER_REGEX_ERROR })
    @IsOptional()
    email: string;

    @IsString()
    @IsOptional()
    @Matches(REGEX.MOBILE_NUMBER, { message: ERROR.MOBILE_NUMBER_REGEX_ERROR })
    mobile_number: string;
}

export class CreateUserDto extends UserBaseDto {

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @Matches(REGEX.PASSWORD, { message: ERROR.PASSWORD_REGEX_ERROR })
    password?: string;


    @IsEnum(USER_ROLES, { message: ERROR.USER_ROLE_ERROR })
    @IsOptional()
    role: USER_ROLES;
}

export class BaseQueryParamDto {
    @IsString()
    @IsOptional()
    search?: string;

    @Type(() => Number) // Convert the string to a number
    @IsNumber()
    @IsOptional()
    page?: number;

    @Type(() => Number) // Convert the string to a number
    @IsNumber()
    @Max(1000)
    @Min(0)
    @IsOptional()
    limit?: number;
}


export class BulkUserRegistrationDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateUserDto)
    users: CreateUserDto[];
}
