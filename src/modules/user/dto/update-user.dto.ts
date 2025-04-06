import { ValidateIf, IsOptional, IsString, IsEmail, Matches, IsEnum, IsNotEmpty } from 'class-validator';
import { CreateUserDto, UserBaseDto } from './create-user.dto';
import { REGEX } from 'src/common/constants/common.constants';
import { USER_ROLES } from 'src/common/enums/database.enum';
import { ERROR } from 'src/common/enums/response.enum';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(UserBaseDto) {

  @ValidateIf(o => !o.mobile_number)
  @IsEmail({}, { message: ERROR.EMAIL_NUMBER_REGEX_ERROR })
  @IsOptional()
  email?: string;

  @ValidateIf(o => !o.email)
  @IsString()
  @IsOptional()
  @Matches(REGEX.MOBILE_NUMBER, { message: ERROR.MOBILE_NUMBER_REGEX_ERROR })
  mobile_number?: string;
}

export class ChangePasswordDto {

  @IsString()
  @IsNotEmpty()
  @Matches(REGEX.PASSWORD, { message: ERROR.PASSWORD_REGEX_ERROR })
  old_password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(REGEX.PASSWORD, { message: ERROR.PASSWORD_REGEX_ERROR })
  new_password: string;
}

export class ChangeRoleDto {

  @IsEnum(USER_ROLES, { message: ERROR.USER_ROLE_ERROR })
  @IsNotEmpty()
  role: USER_ROLES;
}
