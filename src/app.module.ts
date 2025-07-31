/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { AuthModule } from "./auth/auth.module"
import { UserModule } from "./user/user.module"
import { RiskPoolModule } from "./risk-pool/risk-pool.module"
import { PaymentModule } from "./payment/payment.module"
import { MultiPaymentsModule } from "./multi-payments/multi-payments.module"
import { PolicysModule } from "./policys/policys.module"
import { ClaimModule } from "./claim/claim.module"
import { GovernanceModule } from "./governance/governance.module"
import { MailModule } from "./mail/mail.module"
import { LpTokenModule } from './lp-token/lp-token.module';
import { OracleModule } from './oracle/oracle.module';
import { KycModule } from './kyc/kyc.module';
import { FraudDetectionModule } from './fraud-detection/fraud-detection.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.development", ".env"],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST", "localhost"),
        port: configService.get("DB_PORT", 5432),
        username: configService.get("DB_USERNAME", "postgres"),
        password: configService.get("DB_PASSWORD", "postgres"),
        database: configService.get("DB_NAME", "stark_insured"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: configService.get("NODE_ENV", "development") !== "production",
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    RiskPoolModule,
    PaymentModule,
    MultiPaymentsModule,
    PolicysModule,
    ClaimModule,
    GovernanceModule,
    MailModule,
    LpTokenModule,
    OracleModule,
    KycModule,
    FraudDetectionModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
