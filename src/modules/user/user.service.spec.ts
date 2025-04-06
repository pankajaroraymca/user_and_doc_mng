import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HelperService } from 'src/common/services/helper/helper.service';
import { LoggerService } from 'src/common/services/logger/logger.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_ROLES } from 'src/common/enums/database.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FindUserWithCustomIdsDto } from './dto/find-user.dto';
import { BulkDeleteUsersDto } from './dto/delete-user.dto';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let helperService: HelperService;

  const mockUserRepository = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    // Add findAndCount method to the mock repository
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockAuthService = {
    verifyAndUpdatePassword: jest.fn(),
    generateRandomPassword: jest.fn(),
    hashPassword: jest.fn(),
  };

  const mockHelperService = {
    getValidPagination: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: HelperService,
          useValue: mockHelperService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    authService = module.get<AuthService>(AuthService);
    helperService = module.get<HelperService>(HelperService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: USER_ROLES.VIEWER,
        mobile_number: '+1234567890',
      };

      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      mockUserRepository.count.mockResolvedValue(1);
      mockUserRepository.create.mockReturnValue(createUserDto);
      mockUserRepository.save.mockResolvedValue(createUserDto);

      const result = await userService.createUser(createUserDto);

      expect(result).toEqual(createUserDto);
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an error if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: USER_ROLES.VIEWER,
        mobile_number: '+1234567890',
      };

      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({}),
      });

      await expect(userService.createUser(createUserDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should set role to ADMIN for the first user', async () => {
      const createUserDto: CreateUserDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: USER_ROLES.VIEWER,
        mobile_number: '+1234567890',
      };

      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockReturnValue(createUserDto);
      mockUserRepository.save.mockResolvedValue(createUserDto);

      const result = await userService.createUser(createUserDto);

      expect(result.role).toBe(USER_ROLES.ADMIN);
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users with search', async () => {
      const search = 'john';
      const limit = 10;
      const page = 1;

      mockHelperService.getValidPagination.mockReturnValue({
        take: limit,
        skip: 0,
      });

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock findAndCount to return empty results
      mockUserRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await userService.findAllUsers(search, limit, page);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('count');
    });
  });

  describe('findUserById', () => {
    it('should find a user by ID', async () => {
      const userId = 'user-uuid';
      const mockUser = { 
        id: userId, 
        first_name: 'John', 
        email: 'john@example.com',
        role: USER_ROLES.VIEWER 
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.findUserById(userId);

      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      const userId = 'non-existent-uuid';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.findUserById(userId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findWithCustomIdentifiers', () => {
    it('should find user with custom identifiers', async () => {
      const findDto: FindUserWithCustomIdsDto = {
        email: 'john@example.com',
      };

      const mockUser = { 
        id: 'user-uuid', 
        email: 'john@example.com',
        role: USER_ROLES.VIEWER 
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.findWithCustomIdentifiers(findDto);

      expect(result).toEqual(mockUser);
    });

    it('should throw an error if no identifiers provided', async () => {
      const findDto: FindUserWithCustomIdsDto = {};

      await expect(userService.findWithCustomIdentifiers(findDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      // Mock the repository methods used in the update process
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      // Mock the find method to return a result
      mockUserRepository.findAndCount.mockResolvedValue([[{
        id: userId,
        email: 'oldemail@example.com'
      }], 1]);

      // Mock find method for checking duplicates
      userService.find = jest.fn().mockResolvedValue({ data: [{}] });
      
      // Mock update method
      userService.update = jest.fn();

      await userService.updateUser(userId, updateUserDto);

      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should throw an error if multiple unique identifiers are updated', async () => {
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
        username: 'newusername'
      };

      await expect(userService.updateUser(userId, updateUserDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('bulkDeleteUsers', () => {
    it('should delete users successfully', async () => {
      const bulkDeleteDto: BulkDeleteUsersDto = {
        uuids: ['uuid1', 'uuid2'],
      };
      const mockExistingUsers = {
        data: [
          { id: 'uuid1', role: USER_ROLES.VIEWER },
          { id: 'uuid2', role: USER_ROLES.EDITOR },
        ],
      };

      // Mock findAndCount to return users
      mockUserRepository.findAndCount.mockResolvedValue([
        mockExistingUsers.data,
        mockExistingUsers.data.length
      ]);

      userService.find = jest.fn().mockResolvedValue(mockExistingUsers);
      userService.delete = jest.fn().mockResolvedValue({ affected: 2 });

      const result = await userService.bulkDeleteUsers(bulkDeleteDto);

      expect(result).toBe(2);
      expect(userService.delete).toHaveBeenCalledWith({ id: expect.anything() });
    });

    it('should return 0 if no users found', async () => {
      const bulkDeleteDto: BulkDeleteUsersDto = {
        uuids: ['uuid1', 'uuid2'],
      };

      // Mock findAndCount to return empty array
      mockUserRepository.findAndCount.mockResolvedValue([[], 0]);

      userService.find = jest.fn().mockResolvedValue({ data: [] });

      const result = await userService.bulkDeleteUsers(bulkDeleteDto);

      expect(result).toBe(0);
    });
  });

  describe('bulkRegisterUsers', () => {
    it('should register multiple users successfully', async () => {
      const users: CreateUserDto[] = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
          role: USER_ROLES.VIEWER,
          mobile_number: '+1234567890',
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'john2@example.com',
          mobile_number: '9876543210',
          username: 'janesmith',
          role: USER_ROLES.EDITOR,
        },
      ];

      mockUserRepository.find.mockResolvedValue([]);
      mockAuthService.generateRandomPassword.mockReturnValue('randomPassword');
      mockAuthService.hashPassword.mockResolvedValue('hashedPassword');
      userService.batchInsertOrUpdate = jest.fn();

      const result = await userService.bulkRegisterUsers(users);

      expect(result.registeredUsers).toHaveLength(2);
      expect(result.skippedUsers).toHaveLength(0);
      expect(userService.batchInsertOrUpdate).toHaveBeenCalled();
    });

    it('should throw an error if no identifier is provided', async () => {
      const users: CreateUserDto[] = [
        {
          first_name: 'John',
          last_name: 'Doe',
          role: USER_ROLES.VIEWER,
        } as CreateUserDto,
      ];

      await expect(userService.bulkRegisterUsers(users)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});