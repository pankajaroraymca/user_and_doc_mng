import { BadRequestException, Body, Controller, Delete, FileTypeValidator, Get, Headers, MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { DocService } from "./services/doc.service"
import { DocChunkUploadBodyDto, DocChunkUploadHeadersDto } from "./dto/doc.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "src/common/decorators/public/public.decorator";
import * as  multer from "multer";
import { LoggerService } from "src/common/services/logger/logger.service";
import { ValidateHeaders } from "src/common/decorators/validate-headers/validate-headers.decorator";
import { HelperService } from "src/common/services/helper/helper.service";
import { HELPER_ENUM, USER_ROLES } from "src/common/enums/database.enum";
import { SUCCESS } from "src/common/enums/response.enum";
import { Roles } from "src/common/decorators/roles/roles.decorator";
import { User } from "src/common/decorators/user/user.decorator";
import { UserDto } from "src/common/dto/user.dto";
import { BaseQueryParamDto } from "../user/dto/create-user.dto";

@Controller('doc')
export class DocController {

    constructor(
        private docService: DocService
    ) { }

    @Post('/upload')
    @Roles(USER_ROLES.EDITOR, USER_ROLES.ADMIN)
    @UseInterceptors(FileInterceptor('file', {
        storage: multer.memoryStorage(), // USE MEMORY STORAGE FOR CHUNKS
        limits: {
            fileSize: HELPER_ENUM.MAX_FILE_CHUNK_SIZE, // CHUNK SIZE LIMIT
        },
    }),)
    /**
     * Handles the upload of a file chunk to the server.
     * 
     * @param file - The uploaded file chunk, validated using `ParseFilePipe` with a maximum file size validator.
     * @param body - The body of the request containing additional data for the file chunk upload.
     * @param headers - The headers of the request, validated using `DocChunkUploadHeadersDto`.
     * @param user - The user information extracted from the request.
     * 
     * @returns An object containing a success message and the data returned by the `docService.uploadDoc` method.
     * 
     * @throws {BadRequestException} If the uploaded file is invalid or does not meet the validation criteria.
     */
    async uploadChunk(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: HELPER_ENUM.MAX_FILE_CHUNK_SIZE })
            ],
            exceptionFactory: (errors) => new BadRequestException('Invalid file. Please upload a valid file'),
        })
    ) file: Express.Multer.File, @Body() body: DocChunkUploadBodyDto, @ValidateHeaders(DocChunkUploadHeadersDto) headers: DocChunkUploadHeadersDto, @User() user: UserDto) {

        const transformedHeaders = {
            "file-size": Number(headers["file-size"]),
            "file-name": headers["file-name"],
            "actual-file-name": headers["actual-file-name"],
            "total-chunks": Number(headers["total-chunks"]),
            "chunk-index": Number(headers["chunk-index"])
        }

        const data = await this.docService.uploadDoc({ ...body, ...transformedHeaders }, file, user)

        return {
            message: SUCCESS.FILE_UPLOAD_CHUNK_UPLOAD_SUCCESS,
            data
        }
    }

    @Roles(USER_ROLES.EDITOR, USER_ROLES.ADMIN)
    @Patch(':file_id/inactivate')
    /**
     * Marks a file as inactive based on the provided file ID.
     * 
     * @param id - The UUID of the file to be inactivated.
     * @param user - The user performing the inactivation operation.
     * 
     * @returns An object containing a success message and null data.
     * 
     * @throws {BadRequestException} If the file ID is invalid or the operation fails.
     * @throws {UnauthorizedException} If the user is not authorized to perform this action.
     */
    async inactivateFile(@Param('file_id', new ParseUUIDPipe()) id: string, @User() user: UserDto) {

        await this.docService.markFileAsInactive(id, user)

        return {
            data: null,
            message: SUCCESS.FILE_INACTIVATED_SUCCESSFULLY
        }
    }

    @Roles(USER_ROLES.EDITOR, USER_ROLES.ADMIN)
    @Delete(':file_id')
    /**
     * Deletes a file by marking it as inactive.
     *
     * @param id - The UUID of the file to be deleted, validated by `ParseUUIDPipe`.
     * @param user - The user performing the delete operation, injected via the `@User` decorator.
     * @returns An object containing a `null` data field and a success message.
     *
     * @throws {NotFoundException} If the file with the given ID does not exist.
     * @throws {ForbiddenException} If the user does not have permission to delete the file.
     */
    async deleteFile(@Param('file_id', new ParseUUIDPipe()) id: string, @User() user: UserDto) {

        await this.docService.deleteFile(id, user)

        return {
            data: null,
            message: SUCCESS.FILE_DELETED_SUCCESSFULLY
        }
    }

    @Roles(USER_ROLES.VIEWER, USER_ROLES.EDITOR, USER_ROLES.ADMIN)
    @Get(':file_id')
    /**
     * Retrieves a document by its unique identifier.
     *
     * @param id - The unique identifier of the document (UUID).
     * @param user - The user making the request, represented as a `UserDto` object.
     * @returns An object containing the retrieved document data and a success message.
     *
     * @throws {NotFoundException} If the document with the specified ID does not exist.
     * @throws {UnauthorizedException} If the user does not have permission to access the document.
     */
    async getDocById(@Param('file_id', new ParseUUIDPipe()) id: string, @User() user: UserDto) {

        const data = await this.docService.getFileById(id, user)

        return {
            data,
            message: SUCCESS.FILE_GET_SUCCESSFULLY
        }
    }

    @Roles(USER_ROLES.VIEWER, USER_ROLES.EDITOR, USER_ROLES.ADMIN)
    @Get('')
    /**
     * Retrieves all documents based on the provided query parameters and the user context.
     *
     * @param user - The user information extracted from the request, typically used for authorization or filtering.
     * @param baseQueryParamDto - The query parameters for pagination, including `limit` and `page`.
     * @returns An object containing the retrieved documents and a success message.
     *
     * @example
     * // Example usage:
     * const response = await getAllDoc(user, { limit: 10, page: 1 });
     * console.log(response.data); // Array of documents
     * console.log(response.message); // "File retrieved successfully"
     */
    async getAllDoc(@User() user: UserDto, @Query() baseQueryParamDto: BaseQueryParamDto) {

        const data = await this.docService.getAllDocs(baseQueryParamDto.limit, baseQueryParamDto.page, user)

        return {
            data,
            message: SUCCESS.FILE_GET_SUCCESSFULLY
        }
    }
}