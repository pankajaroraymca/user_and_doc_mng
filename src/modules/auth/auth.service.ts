import * as bcrypt from 'bcrypt';
import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CustomJwtService } from 'src/common/services/jwt/jwt.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { SignInDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly saltRounds = 10;
    constructor(
        @Inject(forwardRef(() => UserService))
        private userService: UserService,
        private jwtService: CustomJwtService
    ) { }

    /**
     * Hash the password
     * @param plainPassword 
     * @returns hashed password
     */
    async hashPassword(plainPassword: string): Promise<string> {
        return await bcrypt.hash(plainPassword, this.saltRounds);
    }

    /**
     * Compare plain password with hashed password
     * @param plainPassword 
     * @param hashedPassword 
     * @returns boolean (true if passwords match)
     */
    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Verify if the old password is correct before updating the new one
     * @param oldPassword 
     * @param hashedPassword 
     * @param newPassword 
     * @returns hashed new password
     */
    async verifyAndUpdatePassword(oldPassword: string, hashedPassword: string, newPassword: string): Promise<string> {
        const isMatch = await this.comparePassword(oldPassword, hashedPassword);
        if (!isMatch) {
            throw new BadRequestException('Old password is incorrect');
        }
        return this.hashPassword(newPassword);
    }

    /**
     * Handles the sign-in process for a user.
     *
     * @param body - The data transfer object containing the user's login credentials.
     * @returns An object containing the generated JWT access token.
     * 
     * @throws {UnauthorizedException} If the user is not found or the provided password is invalid.
     *
     * The method performs the following steps:
     * 1. Fetches the user using email, mobile number, or username.
     * 2. Throws an error if the user is not found.
     * 3. Verifies the provided password against the stored hashed password.
     * 4. Throws an error if the password is invalid.
     * 5. Generates a JWT token containing the user's ID, name, email, and role.
     */
    async signIn(body: SignInDto) {
        const { email, mobile_number, username, password } = body;

        // FETCH USER BY EMAIL/USERNAME/MOBILE NUMBER
        const user = await this.userService.findWithCustomIdentifiers({ email, mobile_number, username });

        // THROW ERROR IN CASE USER NOT FOUND
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // VERIFY PASSWORD
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // GENERATE JWT TOKEN
        const token = this.jwtService.sign({
            userId: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role
        });

        return { access_token: token };
    }

    /**
     * Creates a new user with the provided details.
     * 
     * - If the `password` is not provided in the request body, a random password is generated.
     * - Default values are assigned for `first_name` and `last_name` if they are not provided.
     * - The password is hashed before storing the user data.
     * - The password is removed from the response object before returning.
     * 
     * @param body - The data required to create a new user, adhering to the `CreateUserDto` structure.
     * @returns A promise that resolves to the created user object, excluding the password.
     */
    async createUser(body: CreateUserDto) {
       
        let { password, ...rest } = body;

        // GENERATE DEFAULT INFO IF NOT PROVIDED
        password = body.password || this.generateRandomPassword();
        rest.first_name = rest.first_name || 'Guest';
        rest.last_name = rest.last_name || 'User';

        // HASH PASSWORD
        const hashedPassword = await this.hashPassword(password);

        // CREATE USER
        let userData = await this.userService.createUser({ ...rest, password: hashedPassword });

        // DELETE PASSWORD FROM RESPONSE
        delete userData.password
        return userData;
    }

    /**
     * Generate a random password that meets the following criteria:
     * - Minimum 8 characters
     * - At least 1 letter (uppercase or lowercase)
     * - At least 1 number
     * - Can include special characters: @$!%*?&
     * @returns Random password
     */
    generateRandomPassword(): string {
        const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
        const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const specialChars = '@$!%*?&';

        // Ensure at least 1 letter, 1 number, and 1 special character
        const randomLower = lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
        const randomUpper = uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];

        // Combine all characters
        const allChars = lowercaseLetters + uppercaseLetters + numbers + specialChars;

        // Generate the remaining characters randomly
        let password = randomLower + randomUpper + randomNumber + randomSpecial;
        for (let i = 4; i < 8; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password to randomize the order of characters
        password = password
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');

        return password;
    }
}
