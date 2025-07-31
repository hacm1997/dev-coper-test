import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Product one',
    description: 'product name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'This is a sample product description.',
    description: 'product description (optional)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 99.99,
    description: 'product price',
  })
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 'electronics',
    description: 'product category (optional)',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
