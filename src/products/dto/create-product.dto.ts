import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()  
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  purchasePrice: number;

  @ApiProperty()
  @IsNumber()
  salePrice: number;

  @ApiProperty()
  @IsNumber()
  stock: number;

  @ApiProperty()
  @IsNumber()
  alertLevel: number;

  //  @ApiProperty()
   @IsNumber()
  stockInitial: number;
  stockEntriesId: string;
  salesId: string;

//   @ApiProperty()
//   @IsNumber()
//   stockEntriesId: string;

//   @ApiProperty()
//   @IsNumber()
//   salesId: string;
}
