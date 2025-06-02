import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { AppModule } from "./app.module"
import { setupSwagger } from "./config/swagger.config"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Enable CORS for frontend integration
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })

  // Setup Swagger documentation
  setupSwagger(app)

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  console.log(`🚀 Stark Insured Backend is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/docs`)
}

bootstrap()
