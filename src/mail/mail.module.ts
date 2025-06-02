import { Module } from "@nestjs/common"
import { MailerModule } from "@nestjs-modules/mailer"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter"
import { join } from "path"
import { MailService } from "./mail.service"
import { MailController } from "./mail.controller"

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>("MAIL_HOST"),
          port: configService.get<number>("MAIL_PORT"),
          secure: false, // Mailtrap uses TLS
          auth: {
            user: configService.get<string>("MAIL_USER"),
            pass: configService.get<string>("MAIL_PASS"),
          },
        },
        defaults: {
          from: `"${configService.get<string>("MAIL_FROM_NAME")}" <${configService.get<string>("MAIL_FROM_EMAIL")}>`,
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
