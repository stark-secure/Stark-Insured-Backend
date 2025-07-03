import { Test, type TestingModule } from "@nestjs/testing"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import * as request from "supertest"
import { PolicyModule } from "../policy.module"
import { Policy, AssetType, PolicyStatus } from "../entities/policy.entity"

describe("Policy Integration Tests", () => {
  let app: INestApplication
  let policyRepository: Repository<Policy>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Policy],
          synchronize: true,
        }),
        PolicyModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true }))

    policyRepository = moduleFixture.get("PolicyRepository")

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await policyRepository.clear()
  })

  describe("POST /policy", () => {
    const validPolicyData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      coveredAssets: [
        {
          id: "eth-ethereum",
          symbol: "ETH",
          name: "Ethereum",
          assetType: AssetType.CRYPTOCURRENCY,
          coverageLimit: 10000,
          currentValue: 8500,
        },
        {
          id: "usdc-usd-coin",
          symbol: "USDC",
          name: "USD Coin",
          assetType: AssetType.TOKEN,
          contractAddress: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
          coverageLimit: 5000,
          currentValue: 5000,
        },
      ],
      startDate: new Date(Date.now() + 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 31536000000).toISOString(),
      description: "Multi-asset test policy",
    }

    it("should create a multi-asset policy successfully", async () => {
      const response = await request(app.getHttpServer()).post("/policy").send(validPolicyData).expect(201)

      expect(response.body).toMatchObject({
        userId: validPolicyData.userId,
        coveredAssets: expect.arrayContaining([
          expect.objectContaining({
            symbol: "ETH",
            assetType: AssetType.CRYPTOCURRENCY,
          }),
          expect.objectContaining({
            symbol: "USDC",
            assetType: AssetType.TOKEN,
          }),
        ]),
        totalCoverageLimit: 15000,
        totalCurrentValue: 13500,
        status: PolicyStatus.PENDING,
        policyNumber: expect.stringMatching(/^POL-\d{4}-\d{6}$/),
      })

      expect(response.body.totalPremium).toBeGreaterThan(0)
    })

    it("should validate required fields", async () => {
      const invalidData = {
        ...validPolicyData,
        userId: "invalid-uuid",
      }

      await request(app.getHttpServer()).post("/policy").send(invalidData).expect(400)
    })

    it("should reject NFT without contract address", async () => {
      const invalidData = {
        ...validPolicyData,
        coveredAssets: [
          {
            id: "nft-test",
            symbol: "NFT",
            name: "Test NFT",
            assetType: AssetType.NFT,
            coverageLimit: 1000,
            currentValue: 800,
            // Missing contractAddress
          },
        ],
      }

      await request(app.getHttpServer()).post("/policy").send(invalidData).expect(400)
    })

    it("should reject duplicate assets", async () => {
      const invalidData = {
        ...validPolicyData,
        coveredAssets: [
          validPolicyData.coveredAssets[0],
          validPolicyData.coveredAssets[0], // Duplicate
        ],
      }

      await request(app.getHttpServer()).post("/policy").send(invalidData).expect(409)
    })

    it("should reject excessive coverage limits", async () => {
      const invalidData = {
        ...validPolicyData,
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 20000, // 200% of current value
            currentValue: 10000,
          },
        ],
      }

      await request(app.getHttpServer()).post("/policy").send(invalidData).expect(400)
    })
  })

  describe("GET /policy", () => {
    beforeEach(async () => {
      // Create test policies
      const policies = [
        {
          userId: "123e4567-e89b-12d3-a456-426614174000",
          policyNumber: "POL-2024-000001",
          coveredAssets: [
            {
              id: "eth-ethereum",
              symbol: "ETH",
              name: "Ethereum",
              assetType: AssetType.CRYPTOCURRENCY,
              coverageLimit: 10000,
              currentValue: 8500,
              metadata: {},
            },
          ],
          totalCoverageLimit: 10000,
          totalPremium: 500,
          totalCurrentValue: 8500,
          status: PolicyStatus.ACTIVE,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 31536000000),
          terms: {},
        },
        {
          userId: "123e4567-e89b-12d3-a456-426614174001",
          policyNumber: "POL-2024-000002",
          coveredAssets: [
            {
              id: "btc-bitcoin",
              symbol: "BTC",
              name: "Bitcoin",
              assetType: AssetType.CRYPTOCURRENCY,
              coverageLimit: 20000,
              currentValue: 18000,
              metadata: {},
            },
          ],
          totalCoverageLimit: 20000,
          totalPremium: 1000,
          totalCurrentValue: 18000,
          status: PolicyStatus.EXPIRED,
          startDate: new Date(Date.now() - 63072000000), // 2 years ago
          expiryDate: new Date(Date.now() - 31536000000), // 1 year ago
          terms: {},
        },
      ]

      await policyRepository.save(policies)
    })

    it("should return paginated policies", async () => {
      const response = await request(app.getHttpServer()).get("/policy").query({ page: 1, limit: 10 }).expect(200)

      expect(response.body).toMatchObject({
        policies: expect.any(Array),
        total: 2,
        page: 1,
        limit: 10,
      })

      expect(response.body.policies).toHaveLength(2)
    })

    it("should filter by user ID", async () => {
      const response = await request(app.getHttpServer())
        .get("/policy")
        .query({ userId: "123e4567-e89b-12d3-a456-426614174000" })
        .expect(200)

      expect(response.body.policies).toHaveLength(1)
      expect(response.body.policies[0].userId).toBe("123e4567-e89b-12d3-a456-426614174000")
    })

    it("should filter by status", async () => {
      const response = await request(app.getHttpServer())
        .get("/policy")
        .query({ status: PolicyStatus.ACTIVE })
        .expect(200)

      expect(response.body.policies).toHaveLength(1)
      expect(response.body.policies[0].status).toBe(PolicyStatus.ACTIVE)
    })

    it("should filter by asset type", async () => {
      const response = await request(app.getHttpServer())
        .get("/policy")
        .query({ assetType: AssetType.CRYPTOCURRENCY })
        .expect(200)

      expect(response.body.policies).toHaveLength(2)
      response.body.policies.forEach((policy: any) => {
        expect(policy.coveredAssets.some((asset: any) => asset.assetType === AssetType.CRYPTOCURRENCY)).toBe(true)
      })
    })
  })

  describe("GET /policy/:id", () => {
    let testPolicy: Policy

    beforeEach(async () => {
      testPolicy = await policyRepository.save({
        userId: "123e4567-e89b-12d3-a456-426614174000",
        policyNumber: "POL-2024-000001",
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 10000,
            currentValue: 8500,
            metadata: {},
          },
        ],
        totalCoverageLimit: 10000,
        totalPremium: 500,
        totalCurrentValue: 8500,
        status: PolicyStatus.ACTIVE,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 31536000000),
        terms: {},
      })
    })

    it("should return a specific policy", async () => {
      const response = await request(app.getHttpServer()).get(`/policy/${testPolicy.id}`).expect(200)

      expect(response.body).toMatchObject({
        id: testPolicy.id,
        userId: testPolicy.userId,
        policyNumber: testPolicy.policyNumber,
        coveredAssets: expect.arrayContaining([
          expect.objectContaining({
            symbol: "ETH",
            assetType: AssetType.CRYPTOCURRENCY,
          }),
        ]),
        status: PolicyStatus.ACTIVE,
      })
    })

    it("should return 404 for non-existent policy", async () => {
      await request(app.getHttpServer()).get("/policy/123e4567-e89b-12d3-a456-426614174999").expect(404)
    })

    it("should return 400 for invalid UUID", async () => {
      await request(app.getHttpServer()).get("/policy/invalid-uuid").expect(400)
    })
  })

  describe("PATCH /policy/:id", () => {
    let testPolicy: Policy

    beforeEach(async () => {
      testPolicy = await policyRepository.save({
        userId: "123e4567-e89b-12d3-a456-426614174000",
        policyNumber: "POL-2024-000001",
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 10000,
            currentValue: 8500,
            metadata: {},
          },
        ],
        totalCoverageLimit: 10000,
        totalPremium: 500,
        totalCurrentValue: 8500,
        status: PolicyStatus.PENDING,
        startDate: new Date(Date.now() + 86400000),
        expiryDate: new Date(Date.now() + 31536000000),
        terms: {},
      })
    })

    it("should update policy description", async () => {
      const updateData = {
        description: "Updated multi-asset policy",
      }

      const response = await request(app.getHttpServer()).patch(`/policy/${testPolicy.id}`).send(updateData).expect(200)

      expect(response.body.description).toBe("Updated multi-asset policy")
    })

    it("should update covered assets and recalculate totals", async () => {
      const updateData = {
        coveredAssets: [
          {
            id: "btc-bitcoin",
            symbol: "BTC",
            name: "Bitcoin",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 20000,
            currentValue: 18000,
          },
          {
            id: "nft-test",
            symbol: "NFT",
            name: "Test NFT",
            assetType: AssetType.NFT,
            contractAddress: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
            tokenId: "1",
            coverageLimit: 5000,
            currentValue: 4000,
          },
        ],
      }

      const response = await request(app.getHttpServer()).patch(`/policy/${testPolicy.id}`).send(updateData).expect(200)

      expect(response.body.coveredAssets).toHaveLength(2)
      expect(response.body.totalCoverageLimit).toBe(25000)
      expect(response.body.totalCurrentValue).toBe(22000)
      expect(response.body.totalPremium).toBeGreaterThan(0)
    })

    it("should update policy status", async () => {
      const updateData = {
        status: PolicyStatus.ACTIVE,
      }

      const response = await request(app.getHttpServer()).patch(`/policy/${testPolicy.id}`).send(updateData).expect(200)

      expect(response.body.status).toBe(PolicyStatus.ACTIVE)
    })
  })

  describe("DELETE /policy/:id", () => {
    let testPolicy: Policy

    beforeEach(async () => {
      testPolicy = await policyRepository.save({
        userId: "123e4567-e89b-12d3-a456-426614174000",
        policyNumber: "POL-2024-000001",
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 10000,
            currentValue: 8500,
            metadata: {},
          },
        ],
        totalCoverageLimit: 10000,
        totalPremium: 500,
        totalCurrentValue: 8500,
        status: PolicyStatus.EXPIRED,
        startDate: new Date(Date.now() - 63072000000),
        expiryDate: new Date(Date.now() - 31536000000),
        terms: {},
      })
    })

    it("should delete a non-active policy", async () => {
      await request(app.getHttpServer()).delete(`/policy/${testPolicy.id}`).expect(200)

      const deletedPolicy = await policyRepository.findOne({
        where: { id: testPolicy.id },
      })
      expect(deletedPolicy).toBeNull()
    })

    it("should not delete an active policy", async () => {
      await policyRepository.update(testPolicy.id, { status: PolicyStatus.ACTIVE })

      await request(app.getHttpServer()).delete(`/policy/${testPolicy.id}`).expect(400)
    })
  })

  describe("Edge Cases", () => {
    it("should handle large number of assets", async () => {
      const manyAssets = Array.from({ length: 10 }, (_, i) => ({
        id: `asset-${i}`,
        symbol: `ASSET${i}`,
        name: `Asset ${i}`,
        assetType: AssetType.CRYPTOCURRENCY,
        coverageLimit: 1000,
        currentValue: 900,
      }))

      const policyData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        coveredAssets: manyAssets,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        expiryDate: new Date(Date.now() + 31536000000).toISOString(),
      }

      const response = await request(app.getHttpServer()).post("/policy").send(policyData).expect(201)

      expect(response.body.coveredAssets).toHaveLength(10)
      expect(response.body.totalCoverageLimit).toBe(10000)
      // Should have 10% discount for 5+ assets
      expect(response.body.totalPremium).toBeLessThan(500) // 10000 * 0.05 = 500 without discount
    })

    it("should handle mixed asset types with metadata", async () => {
      const mixedAssets = [
        {
          id: "eth-ethereum",
          symbol: "ETH",
          name: "Ethereum",
          assetType: AssetType.CRYPTOCURRENCY,
          coverageLimit: 10000,
          currentValue: 8500,
          metadata: { network: "mainnet", decimals: 18 },
        },
        {
          id: "cryptopunk-1234",
          symbol: "PUNK",
          name: "CryptoPunk #1234",
          assetType: AssetType.NFT,
          contractAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
          tokenId: "1234",
          coverageLimit: 50000,
          currentValue: 45000,
          metadata: {
            rarity: "rare",
            attributes: ["hat", "glasses"],
            collection: "CryptoPunks",
          },
        },
        {
          id: "usdc-token",
          symbol: "USDC",
          name: "USD Coin",
          assetType: AssetType.TOKEN,
          contractAddress: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
          coverageLimit: 5000,
          currentValue: 5000,
          metadata: { stablecoin: true, issuer: "Centre" },
        },
      ]

      const policyData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        coveredAssets: mixedAssets,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        expiryDate: new Date(Date.now() + 31536000000).toISOString(),
        terms: {
          deductible: 1000,
          claimLimit: 2,
          autoRenewal: false,
        },
      }

      const response = await request(app.getHttpServer()).post("/policy").send(policyData).expect(201)

      expect(response.body.coveredAssets).toHaveLength(3)
      expect(response.body.coveredAssets[0].metadata).toEqual({ network: "mainnet", decimals: 18 })
      expect(response.body.coveredAssets[1].metadata).toEqual({
        rarity: "rare",
        attributes: ["hat", "glasses"],
        collection: "CryptoPunks",
      })
      expect(response.body.terms).toEqual({
        deductible: 1000,
        claimLimit: 2,
        autoRenewal: false,
      })
    })
  })
})
