import { DashboardController } from '../modules/dashboard/dashboard.controller';
import { DashboardService } from '../modules/dashboard/dashboard.service';

describe('DashboardController', () => {
  const dashboardService: Partial<DashboardService> = {
    kpis: jest.fn(),
  } as any;
  const thanksModel: any = {
    create: jest.fn(),
  };

  let controller: DashboardController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DashboardController(dashboardService as DashboardService, thanksModel);
  });

  it('createThanks cria registro de agradecimento via model', async () => {
    const payload = { membro_id: 1, descricao: 'Obrigado!' };
    const created = { id: 10, ...payload };
    thanksModel.create.mockResolvedValue(created);
    const res = await controller.createThanks(payload);
    expect(thanksModel.create).toHaveBeenCalledWith({ ...payload });
    expect(res).toBe(created);
  });
});