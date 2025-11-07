import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));
import { AuthService } from '../modules/auth/auth.service';

describe('AuthService - validateUser', () => {
  const jwtService: any = { signAsync: jest.fn().mockResolvedValue('jwt_token') };
  const userModel: any = { findOne: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(userModel, jwtService);
  });

  it('lança UnauthorizedException quando usuário não existe', async () => {
    userModel.findOne.mockResolvedValue(null);
    await expect(service.validateUser('naoexiste@example.com', 'senha'))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException quando senha está incorreta', async () => {
    userModel.findOne.mockResolvedValue({ id: 1, email: 'user@example.com', senha_hash: 'hash', role: 'admin' });
    (bcrypt as any).compare.mockResolvedValue(false);
    await expect(service.validateUser('user@example.com', 'senha_errada'))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('retorna token e usuário quando credenciais são válidas', async () => {
    userModel.findOne.mockResolvedValue({ id: 2, email: 'ok@example.com', senha_hash: 'hash', role: 'admin' });
    (bcrypt as any).compare.mockResolvedValue(true);
    const res = await service.validateUser('ok@example.com', 'senha_certa');
    expect(res.token).toBe('jwt_token');
    expect(res.usuario).toEqual({ id: 2, email: 'ok@example.com', role: 'admin' });
  });
});