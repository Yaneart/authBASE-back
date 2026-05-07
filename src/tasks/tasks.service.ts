import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createTaskDto: CreateTaskDto, userId: string) {
    return this.prismaService.task.create({
      data: {
        title: createTaskDto.title,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prismaService.task.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
    return this.prismaService.task.update({
      where: {
        id,
        userId,
      },
      data: {
        title: updateTaskDto.title,
        completed: updateTaskDto.completed,
      },
    });
  }

  remove(id: string, userId: string) {
    return this.prismaService.task.delete({
      where: {
        id,
        userId,
      },
    });
  }
}
