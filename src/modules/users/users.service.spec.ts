import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from './entities/user.entity.js';
import { CreateUserDto, UpdateUsernameDto } from './users.dto.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUser: User = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    aptosPublicKey: '0x1234567890abcdef',
    createdAt: new Date(),
    updatedAt: new Date(),
    metaAddresses: [],
  };

  const mockUsersRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findByAptosPublicKey: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      aptosPublicKey: '0x1234567890abcdef',
    };

    it('should create a user successfully', async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      mockUsersRepository.findByAptosPublicKey.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(repository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(repository.findByAptosPublicKey).toHaveBeenCalledWith('0x1234567890abcdef');
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw BadRequestException if username already exists', async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new BadRequestException('User with username testuser already exists'),
      );
    });

    it('should throw BadRequestException if Aptos public key already exists', async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      mockUsersRepository.findByAptosPublicKey.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new BadRequestException('User with Aptos public key already exists'),
      );
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        new NotFoundException('User with ID non-existent-id not found'),
      );
    });
  });

  describe('findByUsername', () => {
    it('should return user if found', async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(repository.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(null);

      await expect(service.findByUsername('nonexistent')).rejects.toThrow(
        new NotFoundException('User with username nonexistent not found'),
      );
    });
  });

  describe('findByAptosPublicKey', () => {
    it('should return user if found', async () => {
      mockUsersRepository.findByAptosPublicKey.mockResolvedValue(mockUser);

      const result = await service.findByAptosPublicKey('0x1234567890abcdef');

      expect(result).toEqual(mockUser);
      expect(repository.findByAptosPublicKey).toHaveBeenCalledWith('0x1234567890abcdef');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepository.findByAptosPublicKey.mockResolvedValue(null);

      await expect(service.findByAptosPublicKey('0xnonexistent')).rejects.toThrow(
        new NotFoundException('User with Aptos public key not found'),
      );
    });
  });

  describe('updateUsername', () => {
    const updateUsernameDto: UpdateUsernameDto = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      username: 'newusername',
    };

    it('should update username successfully', async () => {
      const updatedUser = { ...mockUser, username: 'newusername' };
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      mockUsersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUsername(updateUsernameDto.userId, updateUsernameDto.username);

      expect(result).toEqual(updatedUser);
      expect(repository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.findByUsername).toHaveBeenCalledWith('newusername');
      expect(repository.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        { username: 'newusername' },
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.updateUsername(updateUsernameDto.userId, updateUsernameDto.username)).rejects.toThrow(
        new NotFoundException('User with ID 123e4567-e89b-12d3-a456-426614174000 not found'),
      );
    });

    it('should throw BadRequestException if new username is already taken', async () => {
      const anotherUser = { ...mockUser, userId: 'different-id' };
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByUsername.mockResolvedValue(anotherUser);

      await expect(service.updateUsername(updateUsernameDto.userId, updateUsernameDto.username)).rejects.toThrow(
        new BadRequestException('Username newusername is already taken'),
      );
    });

    it('should allow updating to same username for same user', async () => {
      const updateDto = { ...updateUsernameDto, username: 'testuser' };
      const updatedUser = { ...mockUser };
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByUsername.mockResolvedValue(mockUser);
      mockUsersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUsername(updateDto.userId, updateDto.username);

      expect(result).toEqual(updatedUser);
    });
  });
}); 