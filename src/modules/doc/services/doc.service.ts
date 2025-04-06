import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DocEntity } from "../entities/doc.entity";
import { In, Not, Repository } from "typeorm";
import { LoggerService } from "src/common/services/logger/logger.service";
import { CombinedDocUploadDto } from "../dto/doc.dto";
import * as fs from 'fs-extra';
import { FILE_TYPE, FILE_UPLOAD_STATUS, USER_ROLES } from "src/common/enums/database.enum";
import * as _ from 'lodash';
import { BaseService } from "src/common/services/base/base.service";
import { LOGS_ENUM } from "src/common/enums/logs.enum";
import { HelperService } from "src/common/services/helper/helper.service";
import { SUCCESS } from "src/common/enums/response.enum";
import { UserDto } from "src/common/dto/user.dto";


@Injectable()
export class DocService extends BaseService<DocEntity> {

    private readonly chunkFolderPath = `${process.cwd()}/chunk`;
    private readonly mergedFolderPath = `${process.cwd()}/files`;

    constructor(
        @InjectRepository(DocEntity)
        private docRepository: Repository<DocEntity>,
        private loggerService: LoggerService,
        private helperService: HelperService,
    ) {
        super(docRepository, loggerService)
    }

    /**
     * Handles the upload of document chunks, merges them when all chunks are uploaded,
     * validates the document, and saves its metadata to the database.
     *
     * @param bodyAndHeaders - An object containing the headers and body data for the upload request.
     *                         Expected properties include:
     *                         - `total-chunks`: Total number of chunks for the file.
     *                         - `chunk-index`: Index of the current chunk being uploaded.
     *                         - `file-size`: Size of the file in bytes.
     *                         - `file-name`: Name of the file being uploaded.
     *                         - `actual-file-name`: Original name of the file.
     *                         - `unified_id`: Unique identifier for the file.
     * @param file - The current chunk file being uploaded, provided by Multer.
     * @param user - The user uploading the file, containing user-related information.
     *
     * @returns A promise that resolves to the saved document metadata entity if all chunks
     *          are successfully uploaded and merged, or `null` if the process is incomplete.
     *
     * @throws BadRequestException - If an error occurs during the upload, merging, or validation process.
     *
     * @remarks
     * - The function ensures that chunks are saved in a temporary folder and merges them
     *   once all chunks are uploaded.
     * - After merging, the function validates the document and saves its metadata to the database.
     * - Temporary files and folders are cleaned up after successful merging or in case of errors.
     * - Logs are generated at various stages for debugging and monitoring purposes.
     */
    async uploadDoc(bodyAndHeaders: CombinedDocUploadDto, file: Express.Multer.File, user: UserDto) {
        try {

            this.loggerService.log(LOGS_ENUM.FILE_UPLOAD_CHUNK_STARTED);
            const { "total-chunks": total_chunks, "chunk-index": chunk_index, "file-size": file_size, "file-name": file_name, "actual-file-name": actual_file_name, unified_id } = bodyAndHeaders;

            /*
               TEMPORARY FOLDER FOR STORING CHUNKS
               CREATE FOLDER IF NOT EXIST
               */
            const chunkFolderPath = `${this.chunkFolderPath}/${file_name}`;
            fs.ensureDirSync(chunkFolderPath);

            // SAVE THE CHUNK STARTING WITH INDEX 0
            const chunkFilePath = `${chunkFolderPath}/chunk_${chunk_index}`;
            await fs.writeFile(chunkFilePath, file.buffer);
            this.loggerService.log(LOGS_ENUM.FILE_UPLOAD_CHUNK_SINGLE_SAVED);

            // CHECK TOTAL NUMBER OF CHUNKS UPLOADED
            const chunkFiles = await fs.readdir(chunkFolderPath);

            let savedEntityData = null;

            // MERGE THE CHUNKS IF ALL CHUNKS HAVE BEEN UPLOADED
            if (chunkFiles.length === total_chunks) {
                this.loggerService.log(LOGS_ENUM.FILE_UPLOAD_CHUNK_MERGE_STARTED);

                // CHECK OR CREATE THE FINAL MERGED FOLDER PATH 
                fs.ensureDirSync(this.mergedFolderPath);

                // PATH WHERE THE MERGED FILE WILL BE SAVED
                const mergedFilePath = `${this.mergedFolderPath}/${file_name}`;
                const writeStream = fs.createWriteStream(mergedFilePath);

                await new Promise(async (resolve, reject) => {
                    const sortedChunks = chunkFiles
                        .filter((chunk) => chunk.startsWith('chunk_'))
                        .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));

                    for (const chunk of sortedChunks) {
                        const chunkPath = `${chunkFolderPath}/${chunk}`;
                        const readStream = fs.createReadStream(chunkPath);

                        await new Promise((res, rej) => {
                            readStream.pipe(writeStream, { end: false });
                            readStream.on('end', res);
                            readStream.on('error', rej);
                        });
                    }

                    writeStream.end();

                    writeStream.on('finish', async () => {
                        try {
                            this.loggerService.log(LOGS_ENUM.FILE_UPLOAD_CHUNK_MERGE_SUCCESS);

                            const docMetadata = this.helperService.getFileMetadata(mergedFilePath);
                            this.validateDoc(docMetadata);


                            // SAVE FILE METADATA IN DB
                            const docData = {
                                file_name,
                                actual_file_name,
                                file_path: mergedFilePath,
                                file_size,
                                file_type: this.mapDocTypeWithExtension(docMetadata.mimeType),
                                unified_id,
                                owner: user.userId
                            };

                            savedEntityData = await this.create(docData);

                            // CLEAR THE CHUNKS AFTER SUCCESSFULL MERGING
                            await fs.remove(chunkFolderPath);
                            await fs.remove(mergedFilePath);

                            resolve(savedEntityData);
                        } catch (error) {
                            // CLEAR THE CHUNKS AFTER ENCOUNTERING ERROR
                            await fs.remove(chunkFolderPath);
                            await fs.remove(mergedFilePath);
                            reject(error);
                        }
                    });

                    writeStream.on('error', (error) => {
                        reject(error);
                    });
                });
            }

            this.loggerService.log(LOGS_ENUM.FILE_UPLOAD_CHUNK_SUCCESS);
            return savedEntityData
        } catch (error) {
            this.loggerService.error(LOGS_ENUM.FILE_UPLOAD_CHUNK_ERROR, { errorMessage: error.message });
            throw new BadRequestException(error.message);
        }
    }


    /**
     * Marks a file as inactive based on the provided file ID and user information.
     * 
     * This method performs the following steps:
     * 1. Logs the start of the file inactivation process.
     * 2. Constructs a dynamic `where` condition to locate the file, ensuring that
     *    non-admin users can only inactivate files they own.
     * 3. Checks if the file exists. If not, logs an error and throws a `BadRequestException`.
     * 4. Verifies if the file is already inactive. If so, logs a message and returns the file.
     * 5. Updates the file's status to inactive and logs the success message.
     * 
     * @param fileId - The unique identifier of the file to be marked as inactive.
     * @param user - The user performing the operation, containing role and user ID information.
     * 
     * @returns The updated file object with its status set to inactive.
     * 
     * @throws BadRequestException - If the file is not found or the user does not have permission to access it.
     */
    async markFileAsInactive(fileId: string, user: UserDto) {
        this.loggerService.log(LOGS_ENUM.FILE_INACTIVE_STARTED);

        // DYNAMIC WHERE CONDITION BASED ON USER ROLE
        const whereCondition: any = { id: fileId };

        if (user.role !== USER_ROLES.ADMIN) {
            whereCondition.owner = user.userId;
        }

        const file = await this.findOne({ where: whereCondition });

        // CHECK IF FILE EXISTS
        if (!file) {
            this.loggerService.error(LOGS_ENUM.FILE_INACTIVE_REQUEST_NOT_FOUND);
            throw new BadRequestException(SUCCESS.FILE_INACTIVE_NOT_FOUND);
        }

        // CHECK IF FILE IS ALREADY INACTIVE
        if (file.status === FILE_UPLOAD_STATUS.INACTIVE) {
            this.loggerService.log(LOGS_ENUM.FILE_INACTIVE_ALREADY_INACTIVE);
            return file;
        }

        // UPDATE FILE STATUS TO INACTIVE
        file.status = FILE_UPLOAD_STATUS.INACTIVE;
        await this.update(file.id, file);

        this.loggerService.log(LOGS_ENUM.FILE_INACTIVE_SUCCESS);
        return file;
    }

    async deleteFile(fileId: string, user: UserDto) {

        this.loggerService.log(LOGS_ENUM.FILE_DELETE_STARTED)

        // DYNAMIC WHERE CONDITION BASED ON USER ROLE
        const whereCondition: any = { id: fileId };

        if (user.role !== USER_ROLES.ADMIN) {
            whereCondition.owner = user.userId;
        }

        // CHECK IF FILE EXISTS
        const file = await this.findOne({ where: whereCondition });

        if (!file) {
            this.loggerService.error(LOGS_ENUM.FILE_DELETE_REQUEST_NOT_FOUND)
            throw new BadRequestException(SUCCESS.FILE_INACTIVE_NOT_FOUND);
        }

        // DELETE FILE
        await this.delete({ id: fileId });
        this.loggerService.log(LOGS_ENUM.FILE_DELETE_SUCCESS);

    }

    async getFileById(fileId: string, user: UserDto) {

        this.loggerService.log(LOGS_ENUM.FILE_DELETE_STARTED)

        // DYNAMIC WHERE CONDITION BASED ON USER ROLE
        const whereCondition: any = { id: fileId };

        if (user.role !== USER_ROLES.ADMIN) {
            whereCondition.owner = user.userId;
        }

        // CHECK IF FILE EXISTS
        const file = await this.findOne({ where: whereCondition, select: ['actual_file_name', 'created_at', 'file_path', 'file_size', 'file_type', 'status', 'id', 'unified_id'] })

        this.loggerService.log(LOGS_ENUM.FILE_DELETE_SUCCESS);
        return file

    }

    async getAllDocs(limit: number = 250, page: number = 1, user: UserDto) {

        this.loggerService.log(LOGS_ENUM.FILE_DELETE_STARTED)

        // VALIDATE AND GET PAGINATION
        const { take, skip } = this.helperService.getValidPagination(limit, page);

        // CREATE QUERY BUILDER
        const queryBuilder = this.docRepository.createQueryBuilder('doc').select([
            'doc.id',
            'doc.file_name',
            'doc.actual_file_name',
            'doc.file_path',
            'doc.file_size',
            'doc.file_type',
            'doc.status',
            'doc.created_at',
            'doc.owner',
            'doc.unified_id'
        ]);

        // APPLY FILTERS FOR NON-ADMIN USERS
        if (user.role !== USER_ROLES.ADMIN) {
            queryBuilder.where('doc.owner = :ownerId', { ownerId: user.userId });
        }

        // GET DATA USING QUERY BUILDER
        const data = await queryBuilder.take(take).skip(skip).getMany();
        const count = await queryBuilder.getCount();

        return {
            data, count
        }

    }

    mapDocTypeWithExtension(fileType: string) {
        switch (fileType) {
            case 'application/pdf':
                return FILE_TYPE.PDF;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return FILE_TYPE.DOCX;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                return FILE_TYPE.XLSX;
            default:
                return null;
        }
    }

    validateDoc(docMetadata) {

        // Allowed file extensions
        const allowedMimeTypes = [
            'application/pdf',  // PDF
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // XLSX
        ];

        if (!allowedMimeTypes.includes(docMetadata.mimeType)) {
            throw new BadRequestException('Invalid file type. Only PDF, DOCX, and XLSX are allowed')
        }
    }
}