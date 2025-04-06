import { HelperService } from "./helper.service";
import { lookup } from "mime-types";
import { statSync } from "fs";

jest.mock("fs", () => ({
    statSync: jest.fn(),
}));

jest.mock("mime-types", () => ({
    lookup: jest.fn(),
}));

describe("HelperService", () => {
    let helperService: HelperService;

    beforeEach(() => {
        helperService = new HelperService();
    });

    describe("getValidPagination", () => {
        it("should return correct pagination values", () => {
            const result = helperService.getValidPagination(10, 2);
            expect(result).toEqual({ take: 10, skip: 10 });
        });

        it("should return skip = 0 if page is 0", () => {
            const result = helperService.getValidPagination(10, 0);
            expect(result).toEqual({ take: 10, skip: 0 });
        });

        it("should return take = 0 if limit is 0", () => {
            const result = helperService.getValidPagination(0, 1);
            expect(result).toEqual({ take: 0, skip: 0 });
        });
    });

    describe("getFileMetadata", () => {
        it("should return file metadata", () => {
            const mockFilePath = "/path/to/test.pdf";

            (statSync as jest.Mock).mockReturnValue({ size: 12345 });
            (lookup as jest.Mock).mockReturnValue("application/pdf");

            const result = helperService.getFileMetadata(mockFilePath);

            expect(result).toEqual({
                fileName: "test.pdf",
                mimeType: "application/pdf",
                size: 12345,
            });

            expect(statSync).toHaveBeenCalledWith(mockFilePath);
            expect(lookup).toHaveBeenCalledWith(mockFilePath);
        });

        it("should return undefined MIME type if lookup fails", () => {
            const mockFilePath = "/path/to/unknownfile.xyz";

            (statSync as jest.Mock).mockReturnValue({ size: 6789 });
            (lookup as jest.Mock).mockReturnValue(null);

            const result = helperService.getFileMetadata(mockFilePath);

            expect(result).toEqual({
                fileName: "unknownfile.xyz",
                mimeType: null,
                size: 6789,
            });

            expect(statSync).toHaveBeenCalledWith(mockFilePath);
            expect(lookup).toHaveBeenCalledWith(mockFilePath);
        });
    });
});
