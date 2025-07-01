import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Créer une vente
  async create(createSaleDto: CreateSaleDto) {
    const { productId, quantity, client, paymentStatus } = createSaleDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    const totalPrice = quantity * product.salePrice;

    return this.prisma.sale.create({
      data: {
        quantity,
        totalPrice,
        client,
        paymentStatus,
        product: { connect: { id: productId } },
      },
      include: { product: true },
    });
  }

  // ✅ Lister toutes les ventes
  findAll() {
    return this.prisma.sale.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ Trouver une vente par ID
  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!sale) {
      throw new NotFoundException('Vente non trouvée');
    }

    return sale;
  }

  // ✅ Mettre à jour une vente
  async update(id: string, dto: UpdateSaleDto) {
    const sale = await this.findOne(id);

    let totalPrice = sale.totalPrice;

    // Si la quantité ou le produit a changé, on recalcule
    if (dto.quantity || dto.productId) {
      const productId = dto.productId ?? sale.productId;
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new BadRequestException('Produit invalide');
      }

      const quantity = dto.quantity ?? sale.quantity;
      totalPrice = quantity * product.salePrice;
    }

    return this.prisma.sale.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        totalPrice,
        client: dto.client,
        paymentStatus: dto.paymentStatus,
        product: dto.productId
          ? { connect: { id: dto.productId } }
          : undefined,
      },
      include: { product: true },
    });
  }

  // ✅ Supprimer une vente
  async remove(id: string) {
    await this.findOne(id); // Pour vérifier qu'elle existe
    return this.prisma.sale.delete({ where: { id } });
  }

  // ✅ Confirmer une vente
  async confirmSale(id: string) {
    const sale = await this.findOne(id);

    if (sale.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Vente déjà payée');
    }

    return this.prisma.sale.update({
      where: { id },
      data: { paymentStatus: PaymentStatus.PAID },
      include: { product: true },
    });
  }
}
