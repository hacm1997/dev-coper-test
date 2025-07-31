import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, password: string, role: string): Promise<IUser> {
    const hash = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hash, role });
    const saved = await user.save();
    return this.mapToIUser(saved);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.userModel.findOne({ email });
    return user ? this.mapToIUser(user) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await this.userModel.findById(id);
    return user ? this.mapToIUser(user) : null;
  }

  // Utilidad interna
  private mapToIUser(user: UserDocument): IUser {
    return {
      _id: user._id.toString(),
      email: user.email,
      password: user.password,
      role: user.role,
    };
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
  }
}
