import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'prisma/generated/client';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import ms from 'ms';
import { isDev } from 'src/common/utils/is-dev.util';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(res: Response, dto: RegisterDto) {
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

    const { accessToken } = await this.auth(res, user.id);
    return { accessToken, user: this.toSafeUser(user) };
  }

  async login(res: Response, dto: LoginDto) {
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

    const { accessToken } = await this.auth(res, user.id);
    return { accessToken, user: this.toSafeUser(user) };
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

  async refresh(req: Request, res: Response): Promise<{ accessToken: string }> {
    const refreshToken = (req.cookies as Record<string, string | undefined>)?.[
      'refreshToken'
    ];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh-токен отсутствует');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh-токен недействителен');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh-токен не найден');
    }

    await this.prismaService.refreshToken.delete({
      where: { id: stored.id },
    });

    return this.auth(res, payload.sub);
  }

  async logout(req: Request, res: Response): Promise<{ success: boolean }> {
    const refreshToken = (req.cookies as Record<string, string | undefined>)?.[
      'refreshToken'
    ];

    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prismaService.refreshToken.deleteMany({
        where: { tokenHash },
      });
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    return { success: true };
  }

  private signAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_TTL',
        ) as StringValue,
      },
    );
  }

  private signRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_TTL',
        ) as StringValue,
      },
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async auth(
    res: Response,
    userId: string,
  ): Promise<{ accessToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId),
      this.signRefreshToken(userId),
    ]);

    const refreshTtlMs = ms(
      this.configService.getOrThrow<string>('JWT_REFRESH_TTL') as StringValue,
    );

    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt,
      },
    });

    this.setRefreshCookie(res, refreshToken, expiresAt);

    return { accessToken };
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
  ): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: !isDev(this.configService),
      sameSite: 'lax',
      expires: expiresAt,
      path: '/api/auth',
    });
  }

  private toSafeUser(user: User) {
    const { password, ...safe } = user;
    return safe;
  }
}
