import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Admin
import AdminHomePage from '@/app/admin/page';

// Dashboard
import DashboardPage from '@/app/dashboard/page';

// Indications
import IndicacoesPage from '@/app/indications/page';

// Indications · Nova
import NovaIndicacaoPage from '@/app/indications/nova/page';

// Financeiro
import FinanceiroPage from '@/app/financeiro/page';

// --- Mocks para evitar dependências de autenticação, API e componentes complexos ---
// Admin children
jest.mock('../../components/admin/intentions/AdminIntentionsTab', () => () => <div data-testid="AdminIntentionsTab" />);
jest.mock('../../components/admin/users/UsersTable', () => () => <div data-testid="UsersTable" />);

// Dashboard auth wrapper
jest.mock('../../components/auth/RequireAuth', () => ({ children }: any) => <>{children}</>);

// Indications manager
jest.mock('@/components/modules/ReferralsManager', () => () => <div data-testid="ReferralsManager" />);

// Indications · Nova dependencies
jest.mock('@/components/indications/ErrorBanner', () => ({ message }: any) => <div data-testid="ErrorBanner">{message}</div>);
// Evita espalhar props custom no DOM (e.g., submitClassName) para prevenir warnings
jest.mock('@/components/indications/DestinationSelect', () => () => <div data-testid="DestinationSelect" />);
jest.mock('@/components/indications/DescriptionField', () => () => <div data-testid="DescriptionField" />);
jest.mock('@/components/indications/FormActions', () => () => <div data-testid="FormActions" />);

// Mock de AuthProvider usado em NovaIndicacaoPage
jest.mock('@/components/providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: { id: 1, email: 'user@example.com', role: 'admin' } }),
  // FinanceiroPage usa useOptionalAuth; fornecer mock compatível
  useOptionalAuth: () => ({ usuario: { id: 1, email: 'user@example.com', role: 'admin' } }),
}));

// Mock de next/navigation para evitar navegação real
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn() }),
  };
});

// Mock da API para Financeiro e Nova Indicação
jest.mock('@/lib/api', () => ({
  __esModule: true,
  listFees: jest.fn(async () => []),
  totals: jest.fn(async () => ({ totalRecebido: 0, totalPendente: 0 })),
  listUsers: jest.fn(async () => []),
  generateFees: jest.fn(async () => undefined),
  markPaid: jest.fn(async () => undefined),
  updateStatus: jest.fn(async () => undefined),
  cancelFee: jest.fn(async () => undefined),
  notifyLate: jest.fn(async () => undefined),
  sendReminder: jest.fn(async () => undefined),
  default: { get: jest.fn(async () => ({ data: [] })), post: jest.fn(async () => ({ data: {} })) },
}));

// Financeiro UI complexa (não espalhar props no DOM para evitar warnings de atributos desconhecidos)
jest.mock('@/components/financeiro/FeeTable', () => () => <div data-testid="FeeTable" />);
jest.mock('@/components/financeiro/FiltersBar', () => () => <div data-testid="FiltersBar" />);

describe('Smoke · Páginas Protegidas', () => {
  test('AdminHomePage renderiza título e Tabs', () => {
    render(<AdminHomePage />);
    expect(screen.getByRole('heading', { name: 'Área do Administrador' })).toBeInTheDocument();
    // Tabs labels
    expect(screen.getByText('Intenções')).toBeInTheDocument();
    expect(screen.getByText('Usuários existentes')).toBeInTheDocument();
  });

  test('DashboardPage renderiza título e descrição', async () => {
    render(<DashboardPage />);
    // Aguarda que React processe atualizações de estado do DashboardPerformance
    expect(
      await screen.findByRole('heading', { name: 'Dashboard de Performance' })
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Visão geral do desempenho do grupo neste mês.')
    ).toBeInTheDocument();
  });

  test('IndicacoesPage renderiza título e manager (mockado)', () => {
    render(<IndicacoesPage />);
    expect(screen.getByRole('heading', { name: 'Sistema de Indicações' })).toBeInTheDocument();
    expect(screen.getByText('Veja e gerencie suas indicações recebidas e enviadas.')).toBeInTheDocument();
    expect(screen.getByTestId('ReferralsManager')).toBeInTheDocument();
  });

  test('NovaIndicacaoPage renderiza título e campos (mockados)', async () => {
    render(<NovaIndicacaoPage />);
    // Aguarda render e efeitos assíncronos (carregamento de usuários)
    expect(await screen.findByRole('heading', { name: 'Nova Indicação' })).toBeInTheDocument();
    expect(await screen.findByTestId('DestinationSelect')).toBeInTheDocument();
    expect(await screen.findByTestId('DescriptionField')).toBeInTheDocument();
    expect(await screen.findByTestId('FormActions')).toBeInTheDocument();
    // Garante que eventuais updates de estado do efeito foram processados
    await waitFor(() => {
      // Nenhuma asserção adicional específica; apenas sincroniza o ciclo de efeitos
      expect(screen.getByRole('heading', { name: 'Nova Indicação' })).toBeInTheDocument();
    });
  });

  test('FinanceiroPage renderiza título', async () => {
    render(<FinanceiroPage />);
    // Aguarda que React processe atualizações de estado assíncronas do efeito inicial
    expect(await screen.findByRole('heading', { name: 'Financeiro · Mensalidades' })).toBeInTheDocument();
    // Componentes mockados presentes
    expect(await screen.findByTestId('FiltersBar')).toBeInTheDocument();
    expect(await screen.findByTestId('FeeTable')).toBeInTheDocument();
    // Aguarda fim da transição de loading para evitar warn de act
    await waitFor(() => {
      expect(screen.queryByText(/Carregando…/)).not.toBeInTheDocument();
    });
  });
});