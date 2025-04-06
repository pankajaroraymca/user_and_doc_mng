import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { BaseQueryParamDto, BulkUserRegistrationDto, CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto, ChangeRoleDto, UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { USER_ROLES } from 'src/common/enums/database.enum';
import { RolesGuard } from 'src/common/guards/roles/role.guard';
import { BulkDeleteUsersDto } from './dto/delete-user.dto';

@UseGuards(RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.VIEWER)
  /**
   * Retrieves a list of users based on the provided query parameters.
   *
   * @param baseQueryParamDto - An object containing query parameters such as search term, 
   *                            pagination limit, and page number.
   * @returns An object containing the list of users and a success message.
   */
  async findAll(@Query() baseQueryParamDto: BaseQueryParamDto) {

    const data = await this.userService.findAllUsers(baseQueryParamDto.search, baseQueryParamDto.limit, baseQueryParamDto.page)

    return {
      data,
      message: 'Users found successfully'
    }
  }

  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.VIEWER)
  @Get(':user_id')
  /**
   * Retrieves a user by their unique identifier.
   *
   * @param userId - The UUID of the user to retrieve. This parameter is validated using `ParseUUIDPipe`.
   * @returns An object containing the user data and a success message.
   * @throws Will throw an error if the user is not found or if the UUID is invalid.
   */
  async findOne(@Param('user_id', new ParseUUIDPipe()) userId: string) {

    const data = await this.userService.findUserById(userId);

    return {
      data,
      message: 'User found successfully'
    }
  }

  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @Patch(':user_id')
  /**
   * Updates the details of a user based on the provided user ID and update data.
   *
   * @param userId - The UUID of the user to be updated. This is validated using `ParseUUIDPipe`.
   * @param updateUserDto - An object containing the updated user details.
   * @returns An object containing a success message and the updated user data.
   *
   * @throws {BadRequestException} If the provided user ID is not a valid UUID.
   * @throws {NotFoundException} If the user with the given ID does not exist.
   * @throws {InternalServerErrorException} If an error occurs during the update process.
   */
  async updateUser(@Param('user_id', new ParseUUIDPipe()) userId: string, @Body() updateUserDto: UpdateUserDto) {
    console.log("here");


    const updatedUser = await this.userService.updateUser(userId, updateUserDto);

    return { message: 'User updated successfully', data: updatedUser };

  }

  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @Patch('change-password/:user_id')
  /**
   * Handles the password change request for a specific user.
   *
   * @param changePasswordDto - The data transfer object containing the new password details.
   * @param userId - The unique identifier of the user whose password is to be changed.
   * 
   * @returns An object containing a success message and an empty data array.
   * 
   * @throws Will throw an error if the password change operation fails.
   */
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Param('user_id', new ParseUUIDPipe()) userId: string) {
    await this.userService.changePassword(userId, changePasswordDto);

    return {
      message: 'Password changed successfully',
      data: []
    }
  }

  @Roles(USER_ROLES.ADMIN)
  @Patch('change-role/:user_id')
  /**
   * Changes the role of a user.
   *
   * @param body - The data transfer object containing the new role information.
   * @param userId - The unique identifier of the user whose role is to be changed.
   * @returns An object containing a success message and an empty data array.
   *
   * @throws {BadRequestException} If the provided data is invalid.
   * @throws {NotFoundException} If the user with the specified ID does not exist.
   */
  async changeRole(@Body() body: ChangeRoleDto, @Param('user_id', new ParseUUIDPipe()) userId: string) {
    await this.userService.updateUser(userId, body);

    return {
      message: 'Role changed successfully',
      data: []
    }
  }

  @Roles(USER_ROLES.ADMIN)
  @Post('bulk-register-users')
  /**
   * Handles the bulk registration of users.
   * 
   * @param body - The data transfer object containing an array of users to be registered.
   * @returns An object containing a success message and the count of users registered.
   */
  async bulkRegisterUser(@Body() body: BulkUserRegistrationDto) {
    const count = await this.userService.bulkRegisterUsers(body.users);

    return {
      message: 'Bulk registered users successfully',
      data: [count]
    }
  }

  @Roles(USER_ROLES.ADMIN)
  @Post('bulk-delete-users')
  /**
   * Handles the removal of multiple users in bulk.
   * 
   * @param body - The data transfer object containing the list of users to be deleted.
   * @returns An object containing a success message and the count of users deleted.
   */
  async removeUser(@Body() body: BulkDeleteUsersDto) {
    const count = await this.userService.bulkDeleteUsers(body);

    return {
      message: 'Bulk delete users successfully',
      data: [count]
    }
  }
}
