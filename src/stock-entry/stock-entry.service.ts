import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { UpdateStockEntryDto } from './dto/update-stock-entry.dto';

@Injectable()
export class StockEntriesService {
  constructor(private prisma: PrismaService) {}

  async create(createStockEntryDto: CreateStockEntryDto) {
    const { productId, quantity, totalCost, supplier } = createStockEntryDto;

    // Vérifie si le produit existe
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable');

    // Crée l'entrée de stock
    const entry = await this.prisma.stockEntry.create({
      data: {
        productId,
        quantity,
        totalCost,
        supplier,
      },
    });

    // Met à jour le stock du produit
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });

    return entry;
  }

  findAll() {
    return this.prisma.stockEntry.findMany({
      include: {
        product: true,
      },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.stockEntry.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
    if (!entry) throw new NotFoundException('Entrée non trouvée');
    return entry;
  }

  update(id: string, updateStockEntryDto: UpdateStockEntryDto) {
    return this.prisma.stockEntry.update({
      where: { id },
      data: updateStockEntryDto,
    });
  }

  remove(id: string) {
    return this.prisma.stockEntry.delete({
      where: { id },
    });
  }
}
