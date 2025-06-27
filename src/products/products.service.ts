import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient, Product } from '@prisma/client';


@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}


  async create(data: CreateProductDto): Promise<Product> {
    // Vérifier si le produit existe déjà par son nom (utiliser findFirst car name n'est pas unique)
    const existingProduct = await this.prisma.product.findFirst({
      where: { name: data.name },
    });
    if (existingProduct) {
      throw new NotFoundException('Un produit avec ce nom existe déjà');
    }

    // Vérifier si le stock initial est négatif
    if (data.stockInitial < 0) {
      throw new NotFoundException('Le stock initial ne peut pas être négatif');
    }
      
    
    
    // Créer le produit avec stockInitial
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        type: data.type,
        purchasePrice: data. purchasePrice,
        salePrice: data.salePrice,
        stock: data.stock, // Utiliser stockInitial pour initialiser le stock
        alertLevel: data.alertLevel,
        // If you have a stockEntryId in your DTO, use it like this:
        // stockEntries: {
        //   connect: { id: data.stockEntryId },
        // },
      //  sales: {
      //    connect: { id: data.salesId },

      //   },
       
      },
    });

    return product;
  }
  findAll() {
    return this.prisma.product.findMany({
      include: {
        stockEntries: true,
        sales: true, 
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stockEntries: true,
        sales: true,
      },
    });

    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
