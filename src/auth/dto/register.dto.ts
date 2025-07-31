import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'user email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'user password',
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'user role (optional, default: "user")',
  })
  @IsString()
  @IsOptional()
  role: string; // 'admin', 'user', etc.
}
