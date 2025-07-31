import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginatedResult } from 'src/utils/paginate-result.interface';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    try {
      return this.productModel.create(dto);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new InternalServerErrorException('Error creating product');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<ProductDocument>> {
    try {
      const totalItems = await this.productModel.countDocuments();
      const totalPages = Math.ceil(totalItems / limit);
      const data = await this.productModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      return {
        data,
        currentPage: page,
        totalPages,
        totalItems,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new InternalServerErrorException('Error fetching products');
    }
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Producto no encontrado');
  }
}
