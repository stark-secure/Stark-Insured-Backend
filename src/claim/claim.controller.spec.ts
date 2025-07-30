// import { Test, TestingModule } from '@nestjs/testing';
// import { ClaimController } from './claim.controller';
// import { ClaimService } from './claim.service';
// import { UserRole } from '../user/entities/user.entity';

// describe('ClaimController', () => {
//   let controller: ClaimController;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [ClaimController],
//       providers: [ClaimService],
//     }).compile();

//     controller = module.get<ClaimController>(ClaimController);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });
// });

// describe('RBAC for sensitive endpoints', () => {
//   let controller: ClaimController;
//   let claimService: ClaimService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [ClaimController],
//       providers: [
//         {
//           provide: ClaimService,
//           useValue: {
//             update: jest.fn(),
//             runFraudDetection: jest.fn(),
//           },
//         },
//       ],
//     }).compile();
//     controller = module.get<ClaimController>(ClaimController);
//     claimService = module.get<ClaimService>(ClaimService);
//   });

//   it('should only allow admin to update a claim', async () => {
//     const req = { user: { role: UserRole.ADMIN, id: 'admin-id' } };
//     const updateClaimDto = { status: 'APPROVED' };
//     const claimId = 1;
//     claimService.update.mockResolvedValue({ id: claimId, ...updateClaimDto });
//     const result = await controller.update(claimId, updateClaimDto, req);
//     expect(result).toEqual({ id: claimId, ...updateClaimDto });
//     expect(claimService.update).toHaveBeenCalledWith(claimId, updateClaimDto, req.user.id, true);
//   });

//   it('should only allow admin to trigger fraud check', async () => {
//     const req = { user: { role: UserRole.ADMIN, id: 'admin-id' } };
//     const claimId = 1;
//     claimService.runFraudDetection.mockResolvedValue(undefined);
//     const result = await controller.triggerFraudCheck(claimId);
//     expect(result).toEqual({ message: `Fraud detection completed for claim ${claimId}` });
//     expect(claimService.runFraudDetection).toHaveBeenCalledWith(claimId);
//   });
// });
