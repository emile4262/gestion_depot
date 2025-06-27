import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

// Ajoutez une méthode pour créer une vente
async create(createSaleDto: CreateSaleDto) {
  const { productId, quantity, client, paymentStatus } = createSaleDto;

  // 1. On récupère le produit
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundException('Produit non trouvé');
  }

  // 2. On calcule le total
  const totalPrice = quantity * product.salePrice;

  // 3. On crée la vente
  return this.prisma.sale.create({
    data: {
      quantity,
      totalPrice,
      client,
      paymentStatus,
      product: {
        connect: { id: productId },
      },
    },
  });
}

  findAll() {
    return this.prisma.sale.findMany({
      include: {
        product: true,
      },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!sale) throw new NotFoundException('Vente non trouvée');
    return sale;
  }

  update(id: string, dto: UpdateSaleDto) {
    return this.prisma.sale.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        totalPrice: dto.totalPrice,
        client: dto.client,
        paymentStatus: dto.paymentStatus,
        product: dto.productId
          ? { connect: { id: dto.productId } }
          : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.sale.delete({ where: { id } });
  }
}
