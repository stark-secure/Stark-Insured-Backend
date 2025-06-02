import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UserService } from "./user.service"
import { UserController } from "./user.controller"
import { User } from "./entities/user.entity"
import { HashingService } from "../auth/hashing.service"
import { MailModule } from "../mail/mail.module"

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  controllers: [UserController],
  providers: [UserService, HashingService],
  exports: [UserService],
})
export class UserModule {}
