export const REGEX = {

    FIRST_NAME: /^[a-zA-Z'’\- ]+$/, // INDIAN FIRST NAMES
    LAST_NAME: /^[a-zA-Z'’\- ]+$/, // INDIAN LAST NAMES
    MOBILE_NUMBER: /^[0-9]{10,15}$/, 
    PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, // MIN 8 CHARS, ATLEAST 1 LETTER AND 1 NUMBER
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/, // ALPHANUMERIC WITH UNDERSCORE
}