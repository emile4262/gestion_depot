import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean, IsEnum, Length, Matches } from 'class-validator';

export class CreateUserDto {
  newPassword(newPassword: any, arg1: number) {
    throw new Error('Method not implemented.');
  }
   @ApiProperty()
   @IsOptional()
   @IsString()
   name: string;

   @ApiProperty()
   @IsEmail({}, { message: 'Email invalide' })
   @IsNotEmpty({ message: 'Email requis' })
   email: string;
   
   @ApiProperty()
   @IsString()
   @IsNotEmpty({ message: 'Mot de passe requis' })
   @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
   password: string;
  otp: any;

   

}

export class LoginUserDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
   }

export class ResetPasswordDto {
  @ApiProperty({ example: '', description: 'Email de l\'utilisateur' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;
}

// dto/verify-otp.dto.ts
export class VerifyOtpDto {
  @ApiProperty({ example: '', description: 'Email de l\'utilisateur' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({ example: '', description: 'Code OTP à 6 chiffres' })
  @IsString({ message: 'OTP doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'OTP requis' })
  @Matches(/^\d{6}$/, { message: 'OTP doit contenir exactement 6 chiffres' })
  otp: string;

  @ApiProperty({ example: '', description: 'Nouveau mot de passe (min 8 caractères)' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  newPassword: string;
}