import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Ввели не корректный Email' })
  email: string;

  @IsString({ message: 'Ввели не корректный пароль' })
  password: string;
}
