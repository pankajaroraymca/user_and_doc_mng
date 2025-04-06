import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/auth.dto";
import { UserService } from "../user/user.service";
import { CreateUserDto } from "../user/dto/create-user.dto";
import { Public } from "src/common/decorators/public/public.decorator";
import { USER_ROLES } from "src/common/enums/database.enum";

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) { }

    @Public()
    @Post('signin')
    /**
     * Handles the user sign-in process.
     * 
     * @param body - The data transfer object containing the user's sign-in credentials.
     * @returns An object containing a success message and the signed-in user's data.
     */
    async signIn(@Body() body: SignInDto) {
        const user = await this.authService.signIn(body);
        return {
            message: 'User signed in successfully',
            data: user
        }

    }

    @Public()
    @Post('register')
    /**
     * Handles the user sign-up process.
     * 
     * This method creates a new user with the role of `VIEWER` by default.
     * It delegates the user creation logic to the `authService.createUser` method.
     * 
     * @param body - The data transfer object containing user details for sign-up.
     * @returns An object containing a success message and the created user data.
     */
    async signUp(@Body() body: CreateUserDto) {

        body.role = USER_ROLES.VIEWER
        const user = await this.authService.createUser(body);
        return {
            message: 'User signed up successfully',
            data: user
        }
    }
}