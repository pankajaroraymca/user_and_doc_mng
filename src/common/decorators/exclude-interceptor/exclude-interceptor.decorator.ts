import { SetMetadata } from '@nestjs/common';

export const IS_EXCLUDED_FROM_RESPONSE_INTERCEPTOR = 'isExcludedFromResponseInterceptor';
export const ExcludeResponseInterceptor = () => SetMetadata(IS_EXCLUDED_FROM_RESPONSE_INTERCEPTOR, true);
