import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'prisma/generated/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
      },
    });

    const token = await this.signToken(user.id);
    return { token, user: this.toSafeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный Email или пароль');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password);

    if (!passwordOk) {
      throw new UnauthorizedException('Неверный Email или пароль');
    }

    const token = await this.signToken(user.id);
    return { token, user: this.toSafeUser(user) };
  }

  async validate(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден!');
    }

    return this.toSafeUser(user);
  }

  private signToken(userId: string) {
    return this.jwtService.signAsync({ sub: userId });
  }

  private toSafeUser(user: User) {
    const { password, ...safe } = user;
    return safe;
  }
}
