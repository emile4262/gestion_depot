import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {

 @ApiProperty()   
  @IsNumber()
  quantity: number;

//   @ApiProperty()
  @IsNumber()
  totalPrice: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client: string;

  @ApiProperty()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;
  
}
