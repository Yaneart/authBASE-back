import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'Введите текст для комментария' })
  @IsNotEmpty({ message: 'Комментарий не может быть пустым' })
  @MaxLength(1000, { message: 'Комментарий не может быть слишком длинным' })
  text: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
