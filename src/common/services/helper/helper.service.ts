import { Injectable } from "@nestjs/common";
import { lookup } from 'mime-types';
import { statSync } from 'fs';

@Injectable()
export class HelperService {

    constructor() { }

    /**
 * Calculates pagination parameters based on limit and page number.
 *
 * @param {number} limit - The number of records per page.
 * @param {number} page - The current page number.
 * @returns {{ take: number; skip: number }} - An object containing the number of records to take and the number to skip.
 */
    getValidPagination(
        limit: number,
        page: number,
    ): { take: number; skip: number } {
        const skip = page > 0 ? (page - 1) * limit : 0;
        const take = limit > 0 ? limit : 0;

        return {
            take,
            skip,
        };
    }

    getFileMetadata(filePath: string) {


        const mimeType = lookup(filePath); // Get MIME type based on file extension
        const fileName = filePath.split('/').pop(); // Extract file name
        const stats = statSync(filePath);
        return {
            fileName,
            mimeType,
            size: stats.size
        };
    }
}