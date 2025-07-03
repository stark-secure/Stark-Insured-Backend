import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PolicyService } from "./services/policy.service"
import { PolicyController } from "./controllers/policy.controller"
import { Policy } from "./entities/policy.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Policy])],
  controllers: [PolicyController],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
