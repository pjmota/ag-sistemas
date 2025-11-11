import { SchemaInitService } from '../bootstrap/schema-init.service';

describe('SchemaInitService - branches', () => {
  function makeService(mocks?: Partial<{
    describeTable: (name: string) => any,
    addColumn: (table: string, col: string, opts: any) => any,
    removeColumn: (table: string, col: string) => any,
    renameTable: (from: string, to: string) => any,
    dropTable: (name: string) => any,
    query: (sql: string) => any,
  }>) {
    const qi: any = {
      describeTable: jest.fn(async (name: string) => mocks?.describeTable ? mocks.describeTable(name) : {}),
      addColumn: jest.fn(async (t: string, c: string, o: any) => mocks?.addColumn ? mocks.addColumn(t, c, o) : undefined),
      removeColumn: jest.fn(async (t: string, c: string) => mocks?.removeColumn ? mocks.removeColumn(t, c) : undefined),
      renameTable: jest.fn(async (f: string, to: string) => mocks?.renameTable ? mocks.renameTable(f, to) : undefined),
      dropTable: jest.fn(async (name: string) => mocks?.dropTable ? mocks.dropTable(name) : undefined),
    };
    const sequelize: any = {
      getQueryInterface: () => qi,
      query: jest.fn(async (sql: string) => (mocks?.query ? mocks.query(sql) : undefined)),
    };
    return { service: new SchemaInitService(sequelize), qi, sequelize };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adiciona usuarios.nome/empresa e executa backfill quando tabelas existem', async () => {
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return {}; // falta nome/empresa
        if (name === 'membros') return {}; // existe
        if (name === 'mensalidades') return { membro_id: {} }; // existe com coluna antiga
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).toHaveBeenCalledWith('usuarios', 'nome', expect.any(Object));
    expect(qi.addColumn).toHaveBeenCalledWith('usuarios', 'empresa', expect.any(Object));
    expect(sequelize.query).toHaveBeenCalledTimes(2); // dois updates de backfill
    expect(qi.removeColumn).toHaveBeenCalledWith('mensalidades', 'membro_id');
    expect(qi.addColumn).toHaveBeenCalledWith('mensalidades', 'usuario_id', expect.any(Object));
  });

  it('pula backfill quando membros ausentes e ignora mensalidades ausente', async () => {
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} }; // já possui
        if (name === 'membros') throw { parent: { message: 'no such table: membros' } }; // ausente
        if (name === 'mensalidades') throw { parent: { message: 'No description found' } }; // ausente
        return {};
      },
    });
    await service.onModuleInit();
    // Nenhum backfill de usuarios
    expect(sequelize.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE usuarios'));
    // Mensalidades ausente não falha
    expect(qi.addColumn).not.toHaveBeenCalledWith('mensalidades', 'usuario_id', expect.anything());
  });

  it('migra indicacoes adicionando usuario_* e removendo membro_* quando presentes', async () => {
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'indicacoes') return { membro_origem_id: {}, membro_destino_id: {} };
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).toHaveBeenCalledWith('indicacoes', 'usuario_origem_id', expect.any(Object));
    expect(qi.addColumn).toHaveBeenCalledWith('indicacoes', 'usuario_destino_id', expect.any(Object));
    expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE indicacoes AS i'));
    expect(qi.removeColumn).toHaveBeenCalledWith('indicacoes', 'membro_origem_id');
    expect(qi.removeColumn).toHaveBeenCalledWith('indicacoes', 'membro_destino_id');
  });

  it('migra obrigados adicionando usuario_id e removendo membro_id', async () => {
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'obrigados') return { membro_id: {} };
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).toHaveBeenCalledWith('obrigados', 'usuario_id', expect.any(Object));
    expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE obrigados AS o'));
    expect(qi.removeColumn).toHaveBeenCalledWith('obrigados', 'membro_id');
  });

  it('mensalidades existente sem membro_id adiciona apenas usuario_id', async () => {
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'mensalidades') return {}; // sem membro_id e sem usuario_id
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).toHaveBeenCalledWith('mensalidades', 'usuario_id', expect.any(Object));
    expect(qi.removeColumn).not.toHaveBeenCalledWith('mensalidades', 'membro_id');
  });

  it('mensalidades lança erro não esperado e registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'mensalidades') throw new Error('algo inesperado');
        return {};
      },
    });
    await service.onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao adicionar/backfill mensalidades.usuario_id:'), expect.anything());
    warn.mockRestore();
  });

  it('indicacoes: segundo describe ausente ignora remoções pós-sync', async () => {
    let indicCount = 0;
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'indicacoes') {
          indicCount += 1;
          if (indicCount === 1) return { membro_origem_id: {}, membro_destino_id: {} };
          throw { parent: { message: 'No description found' } };
        }
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).toHaveBeenCalledWith('indicacoes', 'usuario_origem_id', expect.any(Object));
    expect(qi.addColumn).toHaveBeenCalledWith('indicacoes', 'usuario_destino_id', expect.any(Object));
    expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE indicacoes AS i'));
    // remoções ignoradas quando describe ausente
    expect(qi.removeColumn).not.toHaveBeenCalledWith('indicacoes', 'membro_origem_id');
    expect(qi.removeColumn).not.toHaveBeenCalledWith('indicacoes', 'membro_destino_id');
  });

  it('indicacoes lança erro não esperado e registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'indicacoes') throw new Error('boom');
        return {};
      },
    });
    await service.onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao migrar indicacoes para usuarios:'), expect.anything());
    warn.mockRestore();
  });

  it('obrigados ausente loga mensagem e não adiciona colunas', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'obrigados') throw { parent: { message: 'No description found' } };
        return {};
      },
    });
    await service.onModuleInit();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] obrigados ausente; sync criará. Pulando migração por enquanto.'));
    expect(qi.addColumn).not.toHaveBeenCalledWith('obrigados', 'usuario_id', expect.anything());
    log.mockRestore();
  });

  it('obrigados lança erro não esperado e registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'obrigados') throw new Error('falhou');
        return {};
      },
    });
    await service.onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao migrar obrigados para usuario_id:'), expect.anything());
    warn.mockRestore();
  });

  it('usuario_planos existente sem membro_id adiciona usuario_id', async () => {
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'usuario_planos') return {}; // já existe sem colunas
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).toHaveBeenCalledWith('usuario_planos', 'usuario_id', expect.any(Object));
    expect(qi.removeColumn).not.toHaveBeenCalledWith('usuario_planos', 'membro_id');
  });

  it('falha ao renomear membro_planos continua sem warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'membro_planos') return {}; // existe antiga
        if (name === 'usuario_planos') throw { parent: { message: 'No description found' } }; // não existe ainda
        return {};
      },
      renameTable: () => { throw new Error('rename error'); },
    });
    await service.onModuleInit();
    expect(qi.renameTable).toHaveBeenCalledWith('membro_planos', 'usuario_planos');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('remoção de tabelas legadas falha e continua sem warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'membro_planos') return {}; // existe para acionar drop
        if (name === 'usuarios_backup') return {}; // existe para acionar drop
        return {};
      },
      dropTable: () => { throw new Error('drop error'); },
    });
    await service.onModuleInit();
    expect(qi.dropTable).toHaveBeenCalledWith('membro_planos');
    expect(qi.dropTable).toHaveBeenCalledWith('usuarios_backup');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('erro geral não esperado registra console.error', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') throw { parent: { message: 'algum outro erro' } };
        return {};
      },
    });
    await service.onModuleInit();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao verificar/adicionar colunas usuarios.nome/empresa:'), expect.anything());
    error.mockRestore();
  });
  it('renomeia membro_planos para usuario_planos e migra colunas', async () => {
    // Controla chamadas para usuario_planos: primeira verificação do rename falha, depois existe com membro_id
    let usuarioPlanosChecked = false;
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'membro_planos') return {}; // existe antiga
        if (name === 'usuario_planos') {
          if (!usuarioPlanosChecked) {
            usuarioPlanosChecked = true;
            throw { parent: { message: 'No description found' } }; // não existe ainda
          }
          return { membro_id: {} }; // após rename, existe com coluna antiga
        }
        if (name === 'usuarios_backup') return {}; // para remoção legada
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.renameTable).toHaveBeenCalledWith('membro_planos', 'usuario_planos');
    expect(qi.addColumn).toHaveBeenCalledWith('usuario_planos', 'usuario_id', expect.any(Object));
    expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE usuario_planos AS up'));
    expect(qi.removeColumn).toHaveBeenCalledWith('usuario_planos', 'membro_id');
    expect(qi.dropTable).toHaveBeenCalledWith('usuarios_backup');
  });

  it('mensalidades: erro inesperado registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'mensalidades') throw new Error('unexpected failure');
        return {};
      },
    });
    await service.onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao adicionar/backfill mensalidades.usuario_id:'), expect.anything());
    warn.mockRestore();
  });

  it('indicacoes: erro inesperado registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'indicacoes') throw new Error('boom');
        return {};
      },
    });
    await service.onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao migrar indicacoes para usuarios:'), expect.anything());
    warn.mockRestore();
  });

  it('obrigados: erro inesperado registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { service } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'obrigados') throw new Error('err obrigados');
        return {};
      },
    });
    await service.onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] Falha ao migrar obrigados para usuario_id:'), expect.anything());
    warn.mockRestore();
  });

  it('retorna cedo quando tabela usuarios ausente na primeira verificação', async () => {
    const { service, qi, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') throw { parent: { message: 'no such table: usuarios' } };
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.addColumn).not.toHaveBeenCalled();
    expect(sequelize.query).not.toHaveBeenCalled();
  });

  it('backfill usuarios: hasUsuarios=false e hasMembros=true registra log e não faz queries', async () => {
    let usuariosCall = 0;
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { service, sequelize } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') {
          usuariosCall += 1;
          // Primeira chamada (outer) retorna desc sem nome/empresa; segunda (inner) simula ausência
          if (usuariosCall === 1) return {};
          throw { parent: { message: 'No description found' } };
        }
        if (name === 'membros') return {};
        return {};
      },
    });
    await service.onModuleInit();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Pulando backfill usuarios.nome/empresa')); 
    expect(sequelize.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE usuarios'));
    log.mockRestore();
  });

  it('indicacoes ausente: registra log e não adiciona colunas', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        if (name === 'indicacoes') throw { parent: { message: 'no such table: indicacoes' } };
        return {};
      },
    });
    await service.onModuleInit();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[SchemaInit] indicacoes ausente; sync criará. Pulando migração por enquanto.'));
    expect(qi.addColumn).not.toHaveBeenCalledWith('indicacoes', 'usuario_origem_id', expect.anything());
    expect(qi.addColumn).not.toHaveBeenCalledWith('indicacoes', 'usuario_destino_id', expect.anything());
    log.mockRestore();
  });

  it('remove tabelas legadas: drop membro_planos e usuarios_backup quando presentes', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { service, qi } = makeService({
      describeTable: (name: string) => {
        if (name === 'usuarios') return { nome: {}, empresa: {} };
        // Simula que as legadas existem
        if (name === 'membro_planos') return {};
        if (name === 'usuarios_backup') return {};
        return {};
      },
    });
    await service.onModuleInit();
    expect(qi.dropTable).toHaveBeenCalledWith('membro_planos');
    expect(qi.dropTable).toHaveBeenCalledWith('usuarios_backup');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Removida tabela legada membro_planos'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Removida tabela legada usuarios_backup'));
    log.mockRestore();
  });

  // Nota: erros em dropTable são engolidos pelos blocos internos; não há warn do bloco externo
});