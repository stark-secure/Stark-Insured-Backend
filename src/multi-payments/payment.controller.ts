import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ValidationPipe,
  } from "@nestjs/common"
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger"
  import { JwtAuthGuard } from "../guards/jwt-auth.guard"
  import { PaymentService } from "../services/payment.service"
  import {
    CreatePaymentDto,
    VerifyPaymentDto,
    PaymentFilterDto,
    PaymentResponseDto,
    ChainInfoDto,
    GenerateAddressDto,
    GeneratedAddressDto,
    EstimateFeeDto,
    FeeEstimateDto,
  } from "../dto/payment.dto"
  
  @ApiTags("payments")
  @Controller("payments")
  export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Create a new payment" })
    @ApiResponse({ status: HttpStatus.CREATED, description: "Payment created successfully", type: PaymentResponseDto })
    async createPayment(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
      return this.paymentService.createPayment(createPaymentDto)
    }
  
    @Post(":id/verify")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Verify a payment transaction" })
    @ApiParam({ name: "id", description: "Payment ID" })
    @ApiResponse({ status: HttpStatus.OK, description: "Payment verified successfully", type: PaymentResponseDto })
    async verifyPayment(
      @Param("id") id: string,
      @Body(ValidationPipe) verifyPaymentDto: VerifyPaymentDto,
    ): Promise<PaymentResponseDto> {
      return this.paymentService.verifyPayment(id, verifyPaymentDto)
    }
  
    @Get(":id")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get payment details by ID" })
    @ApiParam({ name: "id", description: "Payment ID" })
    @ApiResponse({ status: HttpStatus.OK, description: "Payment details retrieved", type: PaymentResponseDto })
    async getPayment(@Param("id") id: string): Promise<PaymentResponseDto> {
      return this.paymentService.getPaymentById(id)
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get user payments with optional filters" })
    @ApiQuery({ name: "status", required: false, description: "Filter by payment status" })
    @ApiQuery({ name: "chainName", required: false, description: "Filter by chain name" })
    @ApiQuery({ name: "type", required: false, description: "Filter by payment type" })
    @ApiResponse({ status: HttpStatus.OK, description: "Payments retrieved", type: [PaymentResponseDto] })
    async getUserPayments(@Query(ValidationPipe) filterDto: PaymentFilterDto): Promise<PaymentResponseDto[]> {
      return this.paymentService.getUserPayments(filterDto)
    }
  
    @Get("chains/supported")
    @ApiOperation({ summary: "Get supported blockchain networks" })
    @ApiResponse({ status: HttpStatus.OK, description: "Supported chains retrieved", type: [ChainInfoDto] })
    @HttpCode(HttpStatus.OK)
    getSupportedChains(): ChainInfoDto[] {
      return this.paymentService.getSupportedChains()
    }
  
    @Post("address/generate")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Generate a payment address for a specific chain" })
    @ApiResponse({ status: HttpStatus.CREATED, description: "Address generated successfully", type: GeneratedAddressDto })
    async generateAddress(
      @Body(ValidationPipe) generateAddressDto: GenerateAddressDto,
    ): Promise<GeneratedAddressDto> {
      // Add user ID if not provided
      return this.paymentService.generateAddress(generateAddressDto)
    }
  
    @Get("fee/estimate")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Estimate transaction fee for a specific chain" })
    @ApiResponse({ status: HttpStatus.OK, description: "Fee estimated successfully", type: FeeEstimateDto })
    async estimateFee(@Query(ValidationPipe) estimateFeeDto: EstimateFeeDto): Promise<FeeEstimateDto> {
      return this.paymentService.estimateFee(estimateFeeDto)
    }
  }
  