import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../database/models/user.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async listAll() {
    // Retorna apenas campos básicos conforme esperado pelos testes e pelo frontend
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
      ativo: true,
    } as any);
    return { id: u.id, email: u.email, role: u.role, nome: u.nome, empresa: u.empresa } as any;
  }

  async update(
    id: number,
    data: {
      nome?: string;
      empresa?: string;
      telefone?: string;
      cargo?: string;
      bio_area_atuacao?: string;
      role?: 'admin' | 'membro';
    }
  ) {
    const u = await this.userModel.findByPk(id);
    if (!u) return null as any;
    if (typeof data.nome !== 'undefined') u.nome = data.nome;
    if (typeof data.empresa !== 'undefined') u.empresa = data.empresa;
    if (typeof data.telefone !== 'undefined') u.telefone = data.telefone as any;
    if (typeof data.cargo !== 'undefined') u.cargo = data.cargo as any;
    if (typeof data.bio_area_atuacao !== 'undefined') u.bio_area_atuacao = data.bio_area_atuacao as any;
    if (typeof data.role !== 'undefined') u.role = data.role as any;
    await u.save();
    return { id: u.id, email: u.email, role: u.role, nome: u.nome, empresa: u.empresa, ativo: u.ativo } as any;
  }

  async setActive(id: number, ativo: boolean) {
    const u = await this.userModel.findByPk(id);
    if (!u) return null as any;
    u.ativo = !!ativo;
    await u.save();
    return { id: u.id, email: u.email, role: u.role, nome: u.nome, empresa: u.empresa, ativo: u.ativo } as any;
  }
}