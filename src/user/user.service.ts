import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { CreateUserDto } from "./dto/create-user.dto"
import { UpdateUserDto } from "./dto/update-user.dto"
import { User, UserRole } from "./entities/user.entity"
import { HashingService } from "../auth/hashing.service"
import { MailService } from "../mail/mail.service"

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly mailService: MailService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    })

    if (existingUser) {
      throw new ConflictException("Email already exists")
    }

    const hashedPassword = await this.hashingService.hashPassword(createUserDto.password)
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.USER,
    })

    const savedUser = await this.userRepository.save(user)

    // Send welcome email (non-blocking)
    this.mailService
      .sendWelcomeEmail(savedUser.email, {
        firstName: savedUser.firstName,
        email: savedUser.email,
      })
      .catch((error) => {
        console.error("Failed to send welcome email:", error)
        // Don't throw error - user creation should succeed even if email fails
      })

    return savedUser
  }

  async findAll() {
    return this.userRepository.find()
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } })
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id)

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashingService.hashPassword(updateUserDto.password)
    }

    Object.assign(user, updateUserDto)
    return this.userRepository.save(user)
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    const user = await this.findOne(id)
    user.refreshToken = refreshToken
    return this.userRepository.save(user)
  }

  async remove(id: string) {
    const user = await this.findOne(id)
    return this.userRepository.remove(user)
  }

  async assignRole(id: string, role: UserRole) {
    const user = await this.findOne(id);
    user.role = role;
    return this.userRepository.save(user);
  }
}
