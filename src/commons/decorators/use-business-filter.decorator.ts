// Custom decorator for applying business logic filter to specific controllers/methods
import { UseFilters } from "@nestjs/common"
import { BusinessLogicExceptionFilter } from "../filters"

export const UseBusinessFilter = () => UseFilters(new BusinessLogicExceptionFilter())
