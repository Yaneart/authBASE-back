import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll() {
    return this.prismaService.comment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateCommentDto) {
    return this.prismaService.comment.create({
      data: {
        userId,
        text: dto.text,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.prismaService.comment.deleteMany({
      where: {
        userId,
        id,
      },
    });

    return true;
  }
}
