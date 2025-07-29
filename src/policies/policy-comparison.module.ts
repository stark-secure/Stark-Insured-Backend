import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PolicyComparisonService } from "./policy-comparison.service"
import { PolicyComparisonController } from "./policy-comparison.controller"
import { Policy } from "./entities/policy.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Policy])],
  providers: [PolicyComparisonService],
  controllers: [PolicyComparisonController],
  exports: [PolicyComparisonService, TypeOrmModule], // Export TypeOrmModule to make entities available
})
export class PolicyComparisonModule {}
