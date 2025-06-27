import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateStockEntryDto {
 @ApiProperty()   
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  totalCost: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  supplier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;
}
