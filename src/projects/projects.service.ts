import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prismaService: PrismaService) {}
  async findAll(userId: string) {
    return this.prismaService.project.findMany({
      where: {
        userId,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prismaService.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto, userId: string) {
    return this.prismaService.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        userId,
      },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.prismaService.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    return this.prismaService.project.update({
      where: {
        id,
      },
      data: updateProjectDto,
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prismaService.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    return this.prismaService.project.delete({
      where: {
        id,
      },
    });
  }
}
