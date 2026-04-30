import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Ввели не корректный Email' })
  email: string;

  @IsString({ message: 'Ввели не корректный пароль' })
  @MinLength(6, { message: 'Минимум 6 знаков' })
  @MaxLength(72, { message: 'Максимум 72 знаков' })
  password: string;

  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Минимум 6 знаков' })
  @MaxLength(50, { message: 'Максимум 72 знаков' })
  name: string;
}
