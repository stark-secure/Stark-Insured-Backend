// import { Test, TestingModule } from '@nestjs/testing';
// import { UserController } from './user.controller';
// import { UserService } from './user.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

// describe('UserController', () => {
//   let controller: UserController;
//   let service: UserService;

//   const mockUserService = {
//     create: jest.fn(),
//     findAll: jest.fn(),
//     findOne: jest.fn(),
//     update: jest.fn(),
//     remove: jest.fn(),
//     assignRole: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [UserController],
//       providers: [
//         {
//           provide: UserService,
//           useValue: mockUserService,
//         },
//       ],
//     }).compile();

//     controller = module.get<UserController>(UserController);
//     service = module.get<UserService>(UserService);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('create', () => {
//     it('should create a user', async () => {
//       const createUserDto: CreateUserDto = {
//         email: 'test@example.com',
//         firstName: 'Test',
//         lastName: 'User',
//         password: 'password123',
//       };

//       mockUserService.create.mockResolvedValue(createUserDto);

//       const result = await controller.create(createUserDto);
//       expect(result).toEqual(createUserDto);
//       expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
//     });
//   });

//   describe('findAll', () => {
//     it('should return an array of users', async () => {
//       const users = [
//         {
//           id: '1',
//           email: 'test@example.com',
//           firstName: 'Test',
//           lastName: 'User',
//         },
//       ];

//       mockUserService.findAll.mockResolvedValue(users);

//       const result = await controller.findAll();
//       expect(result).toEqual(users);
//       expect(mockUserService.findAll).toHaveBeenCalled();
//     });
//   });

//   describe('findOne', () => {
//     it('should return a user', async () => {
//       const user = {
//         id: '1',
//         email: 'test@example.com',
//         firstName: 'Test',
//         lastName: 'User',
//       };

//       mockUserService.findOne.mockResolvedValue(user);

//       const result = await controller.findOne('1');
//       expect(result).toEqual(user);
//       expect(mockUserService.findOne).toHaveBeenCalledWith('1');
//     });
//   });

//   describe('assignRole', () => {
//     it('should assign a role to a user', async () => {
//       const userId = '1';
//       const role = 'admin';
//       const updatedUser = { id: userId, role };
//       mockUserService.assignRole = jest.fn().mockResolvedValue(updatedUser);
//       const result = await controller.assignRole(userId, role);
//       expect(result).toEqual(updatedUser);
//       expect(mockUserService.assignRole).toHaveBeenCalledWith(userId, role);
//     });
//   });
// });
