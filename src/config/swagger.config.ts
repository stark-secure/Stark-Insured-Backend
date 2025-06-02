import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import type { INestApplication } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService)
  const isSwaggerEnabled = configService.get<boolean>("SWAGGER_ENABLED", false)
  const nodeEnv = configService.get<string>("NODE_ENV", "development")

  // Only enable Swagger in development and staging environments
  if (!isSwaggerEnabled || nodeEnv === "production") {
    return
  }

  const config = new DocumentBuilder()
    .setTitle("Stark Insured API")
    .setDescription(
      "The Stark Insured Backend API - A decentralized insurance platform built on StarkNet blockchain. " +
        "This API provides endpoints for user management, policy creation, claims processing, governance, and risk pool management.",
    )
    .setVersion("1.0.0")
    .setContact(
      "Stark Insured Team",
      "https://github.com/Stark-Insured/Stark-Insured-Backend",
      "support@starkinsured.com",
    )
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth", // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag("auth", "Authentication and authorization endpoints")
    .addTag("users", "User management endpoints")
    .addTag("policies", "Insurance policy management")
    .addTag("claims", "Claims processing and management")
    .addTag("payments", "Payment processing endpoints")
    .addTag("risk-pools", "Risk pool management")
    .addTag("governance", "DAO governance and proposal management")
    .addServer("http://localhost:3000", "Development server")
    .addServer("https://api-staging.starkinsured.com", "Staging server")
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  })

  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "Stark Insured API Documentation",
    customfavIcon: "/favicon.ico",
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937; }
    `,
  })

  console.log(`📚 Swagger UI available at: http://localhost:${configService.get("PORT", 3000)}/docs`)
}
