export enum SUCCESS {

}

export enum ERROR {

    FIRST_NAME_REGEX_ERROR = 'First name can only contain English letters, spaces, hyphens, and apostrophes',
    LAST_NAME_REGEX_ERROR = 'Last name can only contain English letters, spaces, hyphens, and apostrophes',
    MOBILE_NUMBER_REGEX_ERROR = 'Mobile number is invalid',
    USERNAME_REGEX_ERROR = 'Username can only contain alphanumeric characters and underscores, and must be 3-20 characters long',
    EMAIL_NUMBER_REGEX_ERROR = 'Email number is invalid',
    PASSWORD_REGEX_ERROR = 'Password must be at least 8 characters long and include at least one letter and one number',
    COUNTRY_CODE_ERROR = 'Country code must be one of the supported codes.',
    USER_ROLE_ERROR = 'Role must be one of the following: admin, editor, viewer'
}

export enum INFO {

}