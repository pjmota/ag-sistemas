import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';

function mockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  it('permite acesso para admin quando role requerida é admin', () => {
    const guard = new RolesGuard('admin');
    const ctx = mockContext({ role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('nega acesso quando usuário não está autenticado', () => {
    const guard = new RolesGuard('admin');
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('nega acesso quando role requerida é admin e usuário é membro', () => {
    const guard = new RolesGuard('admin');
    const ctx = mockContext({ role: 'membro' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});