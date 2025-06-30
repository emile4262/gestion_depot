import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, ResetPasswordDto, VerifyOtpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { promises } from 'dns';
import { randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';



@Injectable()
export class UsersService {
  // validateResetToken is not implemented yet
  // validateResetToken(token: string): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  // Méthode pour exclure uniquement le mot de passe
  private excludeSensitiveFields(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    if (newRole === 'admin' && user.email !== 'bnandoemile@gmail.com') {
      throw new BadRequestException('Seul bnandoemile@gmail.com peut être administrateur');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole as Role,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password' | 'role'>> {
    return this.createUser(createUserDto);
  }

  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password' | 'role'>> {
    const { email, password, name } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const isAdmin = email === 'bnandoemile@gmail.com';

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isAdmin ? Role.ADMIN : Role.VENDEUR,
        createdAt: new Date(),
      },
    });

    return this.excludeSensitiveFields(user);
  }
// obténir tous les utilisateurs
  async findAll(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true, 
        createdAt: true,
      },
    });
  }

  //  obténir un utilisateur pas sont id
  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  // modifier un utilisateur par son id
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Synchroniser les champs admin et role si l'un d'eux est mis à jour
    if (updateUserDto.role) {
      updateData.admin = updateUserDto.role === Role.ADMIN;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
//  supprimer un utlisateur
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async findUserForAuth(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

// connexion d'un utilisateur
 async login(email: string, password: string): Promise<{
  message: string;
  access_token: string;
  refresh_token: string;
}> {
  const user = await this.verifyUser(email, password);

  if (!user) {
    throw new BadRequestException('Email ou mot de passe incorrect');
  }

  // Vérifier si le compte est temporairement bloqué
  if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
    const remainingMinutes = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / (1000 * 60));
    throw new BadRequestException(`Votre compte est bloqué. Réessayez dans ${remainingMinutes} minute(s).`);
  }

  // Définir le rôle
  const userRole = email === 'bnandoemile@gmail.com' ? 'admin' : 'user';

  const payload = {
    sub: user.id,
    email: user.email,
    role: userRole,
  };

  // Vérification que les secrets existent
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET ou JWT_REFRESH_SECRET manquant dans le .env');
  }

  const access_token = this.jwtService.sign(payload, {
    secret: process.env.JWT_SECRET,
    expiresIn: '30m',
  });

  const refresh_token = this.jwtService.sign(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  }); 

  return {
    message: 'Connexion réussie',
    access_token,
    refresh_token,
  };
}


  // Méthode utilitaire pour vérifier si un utilisateur est admin
  async isUserAdmin(email: string): Promise<boolean> {
    return email === 'bnandoemile@gmail.com';
  }

  // Méthode pour promouvoir un utilisateur en admin
  async promoteToAdmin(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    // Seul 'brou@gmail.com' peut être promu admin
    if (user.email !== 'bnandoemile@gmail.com') {
      throw new BadRequestException('Seul bnandoemile@gmail.com peut être administrateur');
    }

    return this.updateUserRole(userId, 'admin');
  }

  // Méthode pour rétrograder un admin en utilisateur normal
 async sendOtp(dto: ResetPasswordDto) {
  const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  // ⚠️ Limite de 1 fois par mois pour les utilisateurs non-admin
//   if (user.role !== Role.ADMIN && user.lastPasswordResetAt) {
//   const now = new Date();
//   const lastReset = new Date(user.lastPasswordResetAt);

//   // Ajouter 7 jours à la dernière réinitialisation
//   const nextAllowed = new Date(lastReset.getTime() + 7 * 24 * 60 * 60 * 1000);

//   if (now < nextAllowed) {
//     const daysLeft = Math.ceil((nextAllowed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
//     throw new BadRequestException(
//       `Vous avez déjà réinitialisé votre mot de passe cette semaine. Veuillez réessayer dans ${daysLeft} jour(s).`
//     );
//   }
// }


  const otp = randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // expire dans 10 minutes

  await this.prisma.user.update({
    where: { email: dto.email },
    data: {
      otp,
      otpExpires,
      lastPasswordResetAt: user.role !== Role.ADMIN ? new Date() : user.lastPasswordResetAt, // mise à jour uniquement si non admin
    },
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Réinitialisation du mot de passe</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; padding: 30px; border-radius: 8px;">
              <tr>
                <td align="center" style="font-size: 24px; font-weight: bold; color: #333333;">
                  Réinitialisation du mot de passe 🔐
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 0; font-size: 16px; color: #555555;">
                  Bonjour ${user.name || 'utilisateur'},
                </td>
              </tr>
              <tr>
                <td style="font-size: 16px; color: #555555;">
                  Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <div style="font-size: 28px; font-weight: bold; color: #007bff; background-color: #e9f0fb; padding: 12px 24px; display: inline-block; border-radius: 4px;">
                    ${otp}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #999999;">
                  Ce code expirera dans <strong>10 minutes</strong>.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 14px; color: #999999;">
                  Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 30px; font-size: 14px; color: #555555;">
                  Merci,<br/>
                  <p> L'équipe gestion de depot </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Support Boutique" <${process.env.EMAIL_USER}>`,
    to: dto.email,
    subject: 'Réinitialisation de mot de passe - Code OTP',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email OTP envoyé à ${dto.email}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    throw new BadRequestException("Impossible d'envoyer l'OTP par e-mail");
  }

  return {
    message: 'OTP envoyé à votre email',
  };
}

  /**
   * Réinitialise le mot de passe avec l'OTP
   */
   async resetPasswordWithOtp(dto: VerifyOtpDto) {
    // Nettoyer les données d'entrée
    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.trim();

    // Récupérer l'utilisateur avec son OTP
    const user = await this.prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }


    // Vérifier que l'OTP existe et n'est pas expiré
    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('Aucun OTP généré pour cet utilisateur');
    }

    if (user.otpExpires < new Date()) {
      throw new BadRequestException('OTP expiré');
    }

   // Comparaison plus robuste de l'OTP
    if (user.otp.trim() !== otp) {
      throw new BadRequestException(`OTP invalide - Reçu: "${otp}", Attendu: "${user.otp}"`);
    }    

    
    // Valider le nouveau mot de passe (ajoutez vos règles de validation)
    if (!dto.newPassword || dto.newPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12); // 12 rounds pour plus de sécurité

    try {
      // Mettre à jour le mot de passe et supprimer l'OTP
      await this.prisma.user.update({
        where: { email: dto.email },
        data: { 
          password: hashedPassword,
          otp: null, // Supprimer l'OTP utilisé
          otpExpires: null, // Supprimer la date d'expiration
          updatedAt: new Date() // Mettre à jour la date de modification
        },
      });
      console.log('Mot de passe réinitialisé avec succès pour:', email);


      return { 
        message: 'Mot de passe réinitialisé avec succès' 
      };

    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      throw new BadRequestException('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * Nettoie les OTP expirés (à appeler périodiquement)
   */
  async cleanupExpiredOtps() {
    const result = await this.prisma.user.updateMany({
      where: {
        otpExpires: { lt: new Date() }
      },
      data: {
        otp: null,
        otpExpires: null
      }
    });
    
    console.log(`${result.count} OTP expirés nettoyés`);
    return result; 
  }

  /**
   * Vérifie si un utilisateur a un OTP valide (utile pour debug)
   */
  async checkOtpStatus(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { 
        email: true, 
        otp: true, 
        otpExpires: true 
      }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const hasValidOtp = user.otp && user.otpExpires && user.otpExpires > new Date();

    return {
      email: user.email,
      hasOtp: !!user.otp,
      otpExpires: user.otpExpires,
      isValid: hasValidOtp
    };
  }

 
}