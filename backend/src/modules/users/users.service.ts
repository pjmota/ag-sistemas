import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../database/models/user.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async listAll() {
    return this.userModel.findAll({ attributes: ['id', 'email', 'role', 'nome', 'empresa'] });
  }

  async create(
    email: string,
    senha: string,
    role: 'admin' | 'membro' = 'membro',
    extras?: { nome?: string; empresa?: string; telefone?: string; cargo?: string; bio_area_atuacao?: string }
  ) {
    const existing = await this.userModel.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }
    const hash = await bcrypt.hash(senha, 10);
    const u = await this.userModel.create({
      email,
      senha_hash: hash,
      role,
      nome: extras?.nome,
      empresa: extras?.empresa,
      telefone: extras?.telefone,
      cargo: extras?.cargo,
      bio_area_atuacao: extras?.bio_area_atuacao,
    } as any);
    return { id: u.id, email: u.email, role: u.role, nome: u.nome, empresa: u.empresa } as any;
  }
}