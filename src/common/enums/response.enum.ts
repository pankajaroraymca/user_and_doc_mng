export enum SUCCESS {
    FILE_INACTIVATED_SUCCESSFULLY = 'File inactivated successfully',
    FILE_INACTIVE_ALREADY_PROCESSED = 'File is already processed by GenAI API',
    FILE_INACTIVE_NOT_FOUND = 'File not found',
    FILE_UPLOAD_CHUNK_UPLOAD_SUCCESS = 'Chunk uploaded successfully',
    FILE_UPLOAD_CHUNK_UPLOAD_ERROR = 'There is an error while uploading file.',
    FILE_DELETED_SUCCESSFULLY = 'File deleted successfully',
    FILE_GET_SUCCESSFULLY = 'File get successfully',

    GENAI_REQUEST_PROCESSED_SUCCESS = 'Your request has been processed to genai.',
    GENAI_REQUEST_PROCESSED_DATA_INSUFFICIENT = 'Your request has not processed due to insufficent data.',

    GENAI_DATA_RECEIVED_SUCCESS = 'Your request to fetch genai data is processed.',

    GENAI_WEBHOOK_PROCESSED_SUCCESSFULLY = 'Your request to webhook has been processed.',

}

export enum ERROR {

    FIRST_NAME_REGEX_ERROR = 'First name can only contain English letters, spaces, hyphens, and apostrophes',
    LAST_NAME_REGEX_ERROR = 'Last name can only contain English letters, spaces, hyphens, and apostrophes',
    MOBILE_NUMBER_REGEX_ERROR = 'Mobile number is invalid',
    USERNAME_REGEX_ERROR = 'Username can only contain alphanumeric characters and underscores, and must be 3-20 characters long',
    EMAIL_NUMBER_REGEX_ERROR = 'Email is invalid',
    PASSWORD_REGEX_ERROR = 'Password must be at least 8 characters long and include at least one letter and one number',
    COUNTRY_CODE_ERROR = 'Country code must be one of the supported codes.',
    USER_ROLE_ERROR = 'Role must be one of the following: admin, editor, viewer',

    ERROR_UNEXPECTED_ERROR_OCCURRED = 'Unexpected error occurred.',
    ERROR_INVALID_TOKEN = 'Invalid authorization.',
    ERROR_TOKEN_EXPIRED = 'Session expired.',
    ERROR_NO_TOKEN = 'No authorization provided.',

    GENAI_REQUEST_FAILED = 'Your request to genai has been failed.',
    GENAI_REQUEST_PROCESSED_DATA_INSUFFICIENT = 'Your request has not processed due to insufficent data.',
}

export enum INFO {

}