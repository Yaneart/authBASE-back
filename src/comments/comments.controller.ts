import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  CurrentUser,
  type SafeUser,
} from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findAll() {
    return this.commentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.commentsService.remove(id, user.id);
  }
}
