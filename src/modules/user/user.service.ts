import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto, ChangeRoleDto, UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Brackets, In, Repository } from 'typeorm';
import { USER_ROLES } from 'src/common/enums/database.enum';
import { HelperService } from 'src/common/services/helper/helper.service';
import { FindUserWithCustomIdsDto } from './dto/find-user.dto';
import { BaseService } from 'src/common/services/base/base.service';
import { LoggerService } from 'src/common/services/logger/logger.service';
import { AuthService } from '../auth/auth.service';
import { BulkDeleteUsersDto } from './dto/delete-user.dto';

@Injectable()
export class UserService extends BaseService<User> {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private helperService: HelperService,
    logger: LoggerService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {
    super(userRepository, logger)
  }

  /**
   * This method registers a new user.
   * This method performs following steps:
   * 1). Check if any user exist with the same email, username, mobile number.
   * 2). In case registered user is first in our application, mark it as admin
   * 3). Saves the data in db for new user.
   * 
   * @param {CreateUserDto} createUserDto 
   * @returns registered user data
   * @throws {BadRequestException} - When some user exist with same details
   */
  async createUser(createUserDto: CreateUserDto) {

    // CHECK IF THE SAME USER EXIST WITH EITHER USERNAME, EMAIL
    const isUserExist = await this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email: createUserDto.email })
      .orWhere('user.username = :username', { username: createUserDto.username })
      .orWhere('user.mobile_number = :mobileNumber', { mobileNumber: createUserDto.mobile_number })
      .getOne()


    // THROW ERROR IN CASE USER FOUND WITH SAME PERSONAL DETAILS
    if (isUserExist) {
      throw new BadRequestException('User already exist with same details')
    }

    /*IN CASE THRE IS NO USER IN OUR APPLICATION, MARK THE FIRST USER AS ADMIN IRRESPECTIVE OF ROLE RECEIVED FROM REQUEST
      THIS IS BASED ON THE REQUIREMENT
      MIGHT BE DIFFERENT IN SOME APPLICATION
    */
    const totalUserRegisteredCount = await this.userRepository.count()
    if (totalUserRegisteredCount === 0) {
      createUserDto.role = USER_ROLES.ADMIN
    }

    const entityInstance = this.userRepository.create(createUserDto)
    const savedEntityData = await this.userRepository.save(entityInstance)
    return createUserDto
  }

  /**
* This method returns the data of all users with pagination and search filter.
* This method performs following steps:
* 1). Get the valid pagination limit and offset number.
* 2). Apply the search criteria on first name, last name, email and username
* 3). Return the total users and filtered data
* 
* @param {string} search
* @param {number} limit
* @param {number} page
* @returns filtered all user data
*/
  async findAllUsers(search: string, limit: number = 250, page: number = 1) {

    // GET THE VALID LIMIT AND OFFSET NUMBER
    const { take, skip } = this.helperService.getValidPagination(limit, page);

    // CREATE THE QUERY BUILDER
    const queryBuilder = this.userRepository.createQueryBuilder('user').select([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.email',
      'user.mobile_number',
      'user.username',
      'user.role',
      'user.is_active',
      'user.updated_at'
    ]);

    // APPLY THE SEARCH CRITERIA
    if (search) {
      queryBuilder
        .andWhere(
          new Brackets((qb) => {
            ['first_name', 'last_name', 'email', 'username'].forEach((column) => {
              qb.orWhere(`"user".${column}::text ILIKE :search`, {
                search: `%${search}%`,
              });
            });
          })
        )
        .setParameter('search', `%${search}%`);

      queryBuilder.orderBy('"user".updated_at', 'DESC');
    }

    // APPLY THE PAGINATION
    const data = await queryBuilder.take(take).skip(skip).getMany();
    const count = await queryBuilder.getCount();

    return {
      data, count
    }
  }

  /**
 * This method returns the data of particular user.
 * This method performs following steps:
 * 1). Check if any user exist with the id.
 * 2). Selects particular column and returns the data
 * 
 * @param {string} id 
 * @returns user data
 * @throws {BadRequestException} - When no such user finds with given id
 */
  async findUserById(id: string) {

    const isUserExist = await this.userRepository.findOne({
      where: { id: id },
      select: ['id', 'first_name', 'last_name', 'email', 'mobile_number', 'username', 'role', 'is_active']
    })

    if (!isUserExist) {
      throw new BadRequestException('No user found with this id')
    }

    return isUserExist

  }

  async findWithCustomIdentifiers(body: FindUserWithCustomIdsDto) {
    const { email, mobile_number, username } = body;

    if (!email && !mobile_number && !username) {
      throw new BadRequestException('At least one field (email, mobile, or username) is required');
    }

    const conditions = [];

    if (email) {
      conditions.push({ email });
    }

    if (mobile_number) {
      conditions.push({ mobile_number: mobile_number });
    }

    if (username) {
      conditions.push({ username });
    }

    const user = await this.userRepository.findOne({
      where: conditions,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }


  /**
   * Updates a user's details based on the provided `updateUserDto` or `changeRoleDto`.
   * 
   * @param userId - The unique identifier of the user to be updated.
   * @param updateUserDto - An object containing the fields to update. It can be either:
   *   - `UpdateUserDto`: For updating user details like email, username, or mobile number.
   *   - `ChangeRoleDto`: For changing the user's role.
   * 
   * @throws {NotFoundException} If the user with the given `userId` does not exist.
   * @throws {BadRequestException} If more than one unique identifier (email, username, or mobile number) is provided for update.
   * @throws {BadRequestException} If another user already exists with the same email, username, or mobile number.
   * 
   * @returns A promise that resolves when the user is successfully updated.
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto | ChangeRoleDto) {

    // CHECK IF THE USER EXIST
    const user = this.find({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uniqueFields = [updateUserDto['email'], updateUserDto['username'], updateUserDto['mobile_number']].filter(Boolean)

    // CHECK IF ONLY ONE UNIQUE FIELD IS PASSED
    if (uniqueFields.length > 1) {
      throw new BadRequestException('Only one unique identifier can be updated at a time');
    }

    // CHECK IF THE SAME USER EXIST WITH EITHER USERNAME, EMAIL
    const isUserExist = await this.userRepository.createQueryBuilder('user')
      .where('user.id != :id', { id: userId })
      .andWhere(new Brackets((qb) => {
        if (updateUserDto['email']) {
          qb.orWhere('user.email = :email', { email: updateUserDto['email'] })
        } if (updateUserDto['username']) {
          qb.orWhere('user.username = :username', { username: updateUserDto['username'] })
        } if (updateUserDto['mobile_number']) {
          qb.orWhere('user.mobile_number = :mobileNumber', { mobileNumber: updateUserDto['mobile_number'] })
        }
      })
      )
      .getOne()

    // CHECK IF THE USER EXIST WITH SAME DETAILS
    if (isUserExist && uniqueFields.length > 0) {
      throw new BadRequestException('User already exist with same details')
    }

    // IF THERE IS ONLY 1 USER IN SYSTEM, WE CAN'T CHANGE THE ROLE FROM ADMIN TO ANY OTHER ROLE
    const totalUserRegisteredCount = await this.userRepository.count()
    if (totalUserRegisteredCount === 1 && updateUserDto['role'] !== USER_ROLES.ADMIN) {
      throw new BadRequestException('You can not change the role of the only user in the system');
    }

    await this.update(userId, updateUserDto);
  }

  /**
   * Changes the password for a user.
   *
   * @param userId - The unique identifier of the user whose password is to be changed.
   * @param body - An object containing the old password and the new password.
   * @throws {BadRequestException} If the user is not found or if the old password is incorrect.
   * @returns A promise that resolves when the user's password has been successfully updated.
   */
  async changePassword(userId: string, body: ChangePasswordDto) {

    // EXTRACT THE OLD AND NEW PASSWORDS FROM THE REQUEST BODY
    const { old_password, new_password } = body;

    // CHECK IF THE USER EXIST
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // CHECK IF THE OLD PASSWORD IS CORRECT
    const updatedPassword = await this.authService.verifyAndUpdatePassword(old_password, user.password, new_password);

    // UPDATE THE USER'S PASSWORD
    user.password = updatedPassword;
    await this.userRepository.save(user)
  }

  /**
  * Bulk delete users by UUIDs (only if they exist in the database)
  * @param uuids Array of UUIDs to delete
  * @returns Number of deleted users
  */
  async bulkDeleteUsers(body: BulkDeleteUsersDto): Promise<number> {
    // Find users whose UUIDs exist in the database
    const existingUsers = await this.find({ where: { id: In(body.uuids) } });

    if (existingUsers.data.length === 0) {
      return 0; // No users found, nothing to delete
    }

    // Extract UUIDs of existing users
    const existingUuids = existingUsers.data.map((user) => user.id);

    // Perform bulk deletion for existing UUIDs
    const deleteResult = await this.delete({ id: In(existingUuids) });

    return deleteResult.affected || 0; // Return the number of deleted users
  }

  /**
   * Validate that at least one identifier is provided
   * @param user User data
   */
  private validateIdentifiers(user: CreateUserDto): void {
    const identifiers = [user.email, user.mobile_number].filter(Boolean);
    if (identifiers.length === 0) {
      throw new BadRequestException('At least one identifier (email, mobileNumber) is required');
    }
  }

  /**
   * Registers multiple users in bulk while ensuring no duplicate identifiers (email, mobile number, or username) exist.
   * 
   * @param users - An array of `CreateUserDto` objects representing the users to be registered.
   * 
   * @returns A promise that resolves to an object containing:
   * - `registeredUsers`: An array of successfully registered users with their details (excluding hashed passwords).
   * - `skippedUsers`: An array of `CreateUserDto` objects representing users that were skipped due to duplicate identifiers.
   * 
   * @throws Will throw an error if any user does not provide at least one identifier (email, mobile number, or username).
   * 
   * ### Process:
   * 1. Extracts identifiers (email, mobile number, username) from the input users.
   * 2. Fetches existing users from the database that match any of the provided identifiers.
   * 3. Skips users whose identifiers already exist in the database.
   * 4. Sets default values for missing fields (e.g., password, first name, last name).
   * 5. Hashes passwords for new users and prepares their data for insertion.
   * 6. Inserts new users into the database in bulk.
   * 
   * ### Notes:
   * - If a user does not provide a password, a random password is generated and returned in the response.
   * - Default values for `first_name` and `last_name` are set to "Guest" and "User" respectively if not provided.
   */
  async bulkRegisterUsers(users: CreateUserDto[]): Promise<{ registeredUsers: User[], skippedUsers: CreateUserDto[] }> {

    // EXTRACT IDENTIFIERS FROM USERS
    const emails = users.map((user) => user.email).filter(Boolean);
    const mobileNumbers = users.map((user) => user.mobile_number).filter(Boolean);
    const usernames = users.map((user) => user.username).filter(Boolean);

    // FETCH EXISTING USERS
    const existingUsers = await this.userRepository.find({
      where: [
        { email: In(emails) },
        { mobile_number: In(mobileNumbers) },
        { username: In(usernames) },
      ],
      select: ['email', 'mobile_number', 'username'], // Only fetch the identifiers
    });

    // CREATE A SET OF EXISTING IDENTIFIERS FOR QUICK LOOKUP
    const existingIdentifiers = new Set(
      existingUsers.flatMap((user) => [
        user.email,
        user.mobile_number,
        user.username,
      ]),
    );

    // PREPARE DATA FOR INSERTION
    const usersToInsert = [];
    const response = []
    const skippedUsers = [];

    for (const user of users) {
     
      // VALIDATE AT LEAST ONE IDENTIFIER IS PROVIDED
      this.validateIdentifiers(user);

      // CHECK IF ANY IDENTIFIER ALREADY EXISTS
      const identifiers = [user.email, user.mobile_number, user.username].filter(Boolean);
      const hasDuplicate = identifiers.some((identifier) => existingIdentifiers.has(identifier));

      if (hasDuplicate) {

        // SKIP THE USER IF ANY IDENTIFIER ALREADY EXISTS
        skippedUsers.push(user);
        continue;
      }

      // SET DEFAULT PASSWORD AND NAME IF NOT PROVIDED
      const password = user.password || this.authService.generateRandomPassword();
      const hashedPassword = await this.authService.hashPassword(password);
      const firstName = user.first_name || 'Guest'
      const lastName = user.last_name || 'User'

      // PREPARE DATA FOR INSERTION
      let dataToPush = {
        email: user?.email ?? null,
        mobile_number: user?.mobile_number ?? null,
        username: user?.username ?? null,
        first_name: firstName,
        last_name: lastName,
        password: hashedPassword,
      }

      usersToInsert.push(dataToPush);
      response.push({ ...dataToPush, password: password })

      // ADD THE NEW IDENTIFIERS TO THE SET
      identifiers.forEach((identifier) => existingIdentifiers.add(identifier));
    }

    // INSERT NEW USERS
    await this.batchInsertOrUpdate(usersToInsert);

    return {
      registeredUsers: response,
      skippedUsers,
    };
  }
}
