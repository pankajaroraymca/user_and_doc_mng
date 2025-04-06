import { Type } from "class-transformer";
import { IsArray, IsUUID } from "class-validator";

export class BulkDeleteUsersDto {
    @IsArray()
    @IsUUID(4, { each: true }) // Validate each UUID in the array
    @Type(() => String) // Ensure each item is treated as a string
    uuids: string[];
}
