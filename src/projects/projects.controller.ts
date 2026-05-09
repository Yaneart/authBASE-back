import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CurrentUser,
  type SafeUser,
} from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: SafeUser) {
    return this.projectsService.findAll(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.projectsService.findOne(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.projectsService.remove(id, user.id);
  }
}
