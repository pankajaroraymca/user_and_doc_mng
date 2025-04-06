import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CustomJwtService } from 'src/common/services/jwt/jwt.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { SignInDto } from './dto/auth.dto';
import { USER_ROLES } from 'src/common/enums/database.enum';

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UserService;
    let jwtService: CustomJwtService;

    const mockUserService = {
        findWithCustomIdentifiers: jest.fn(),
        createUser: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: CustomJwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        jwtService = module.get<CustomJwtService>(CustomJwtService);
    });

    describe('hashPassword', () => {
        it('should hash a plain password', async () => {
            const plainPassword = 'testPassword123';
            const hashedPassword = await authService.hashPassword(plainPassword);

            expect(hashedPassword).not.toBe(plainPassword);
            expect(hashedPassword).toBeTruthy();
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching passwords', async () => {
            const plainPassword = 'testPassword123';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const result = await authService.comparePassword(plainPassword, hashedPassword);
            expect(result).toBe(true);
        });

        it('should return false for non-matching passwords', async () => {
            const plainPassword = 'testPassword123';
            const wrongPassword = 'wrongPassword';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const result = await authService.comparePassword(wrongPassword, hashedPassword);
            expect(result).toBe(false);
        });
    });

    describe('verifyAndUpdatePassword', () => {
        it('should update password when old password is correct', async () => {
            const oldPassword = 'oldPassword123';
            const newPassword = 'newPassword456';
            const hashedOldPassword = await bcrypt.hash(oldPassword, 10);

            const result = await authService.verifyAndUpdatePassword(oldPassword, hashedOldPassword, newPassword);

            expect(result).toBeTruthy();
            expect(result).not.toBe(hashedOldPassword);
        });

        it('should throw BadRequestException when old password is incorrect', async () => {
            const oldPassword = 'oldPassword123';
            const wrongOldPassword = 'wrongOldPassword';
            const newPassword = 'newPassword456';
            const hashedOldPassword = await bcrypt.hash(oldPassword, 10);

            await expect(
                authService.verifyAndUpdatePassword(wrongOldPassword, hashedOldPassword, newPassword)
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('signIn', () => {
        const mockUser = {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            password: '$2b$10$mockHashedPassword', // Mocked bcrypt hash
            role: USER_ROLES.VIEWER,
        };

        const signInDto: SignInDto = {
            email: 'john@example.com',
            password: 'correctPassword',
        };

        it('should sign in a user successfully', async () => {
            // Mock user service to return user
            mockUserService.findWithCustomIdentifiers.mockResolvedValue(mockUser);

            // Mock bcrypt compare to return true
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            // Mock JWT token generation
            mockJwtService.sign.mockReturnValue('mock-jwt-token');

            const result = await authService.signIn(signInDto);

            expect(result).toEqual({ access_token: 'mock-jwt-token' });
            expect(mockUserService.findWithCustomIdentifiers).toHaveBeenCalledWith({
                email: signInDto.email,
                mobile_number: undefined,
                username: undefined,
            });
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                userId: mockUser.id,
                name: `${mockUser.first_name} ${mockUser.last_name}`,
                email: mockUser.email,
                role: mockUser.role,
            });
        });

        it('should throw UnauthorizedException when user not found', async () => {
            mockUserService.findWithCustomIdentifiers.mockResolvedValue(null);

            await expect(authService.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when password is incorrect', async () => {
            // Mock user service to return user
            mockUserService.findWithCustomIdentifiers.mockResolvedValue(mockUser);

            // Mock bcrypt compare to return false
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

            await expect(authService.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('createUser', () => {
        const createUserDto: CreateUserDto = {
            first_name: "Guest",
            last_name: "User",
            username: 'XXXXXXXX',
            mobile_number: '8656956596',
            email: 'test@example.com',
            password: 'testPassword123',
            role: USER_ROLES.VIEWER,
        };

        it('should create a user with provided details', async () => {
            const mockCreatedUser = {
                ...createUserDto,
                id: '1',
                first_name: 'Guest',
                last_name: 'User',
            };
            delete mockCreatedUser.password;

            mockUserService.createUser.mockResolvedValue(mockCreatedUser);

            const result = await authService.createUser(createUserDto);

            expect(result).toEqual(mockCreatedUser);
            expect(mockUserService.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: createUserDto.email,
                    role: USER_ROLES.VIEWER,
                    first_name: 'Guest',
                    last_name: 'User',
                    username: 'XXXXXXXX',
                    mobile_number: '8656956596',
                })
            );
        });

        it('should generate random password if not provided', async () => {
            const userDtoWithoutPassword = { ...createUserDto };
            delete userDtoWithoutPassword.password;

            const mockCreatedUser = {
                ...userDtoWithoutPassword,
                id: '1',
                first_name: 'Guest',
                last_name: 'User',
            };
            delete mockCreatedUser.password;

            mockUserService.createUser.mockResolvedValue(mockCreatedUser);

            const result = await authService.createUser(userDtoWithoutPassword);

            expect(result).toEqual(mockCreatedUser);
            expect(mockUserService.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: userDtoWithoutPassword.email,
                    role: USER_ROLES.VIEWER,
                    first_name: 'Guest',
                    last_name: 'User',
                })
            );
        });
    });

    describe('generateRandomPassword', () => {
        it('should generate a password with correct length and complexity', () => {
            const password = authService.generateRandomPassword();

            expect(password.length).toBe(8);

            // Check if the password contains at least:
            // 1 lowercase letter, 1 uppercase letter, 1 number, 1 special character
            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/;
            expect(regex.test(password)).toBe(true);
        });

        it('should generate different passwords on multiple calls', () => {
            const password1 = authService.generateRandomPassword();
            const password2 = authService.generateRandomPassword();

            expect(password1).not.toBe(password2);
        });
    });
});