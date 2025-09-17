// Filter module for dependency injection and configuration
import { Module, Global } from "@nestjs/common"
import {
  HttpExceptionFilter,
  ValidationExceptionFilter,
  TypeOrmExceptionFilter,
  UnhandledExceptionFilter,
  BusinessLogicExceptionFilter,
} from "./index"

@Global()
@Module({
  providers: [
    // Alternative way to register filters globally via providers
    // Uncomment if you prefer this approach over main.ts registration
    /*
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: TypeOrmExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UnhandledExceptionFilter,
    },
    */

    // Export filters for manual use with @UseFilters()
    HttpExceptionFilter,
    ValidationExceptionFilter,
    TypeOrmExceptionFilter,
    UnhandledExceptionFilter,
    BusinessLogicExceptionFilter,
  ],
  exports: [
    HttpExceptionFilter,
    ValidationExceptionFilter,
    TypeOrmExceptionFilter,
    UnhandledExceptionFilter,
    BusinessLogicExceptionFilter,
  ],
})
export class FilterModule {}
