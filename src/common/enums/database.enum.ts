export enum USER_ROLES {
    ADMIN = 'ADMIN',
    VIEWER = 'VIEWER',
    EDITOR = 'EDITOR'
}

export enum FILE_UPLOAD_STATUS {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export enum TABLE_NAME {
    USER = 'user',
    DOC = 'doc',
    GENAI = 'genai',
}

export enum HELPER_ENUM {
    MAX_FILE_CHUNK_SIZE = 2097152 // 2MB
}

export enum FILE_TYPE {
    PDF = 'PDF',
    DOCX = 'DOCX',
    XLSX = 'XLSX',
}

export enum GENAI_ANALYSIS_STATUS {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAIL = 'FAIL',
    ACK = 'ACK'
}

export enum GENAI_DS_API_STATUS {
    SUCCESS = 'SUCCESS',
    FAIL = 'FAIL'
}

