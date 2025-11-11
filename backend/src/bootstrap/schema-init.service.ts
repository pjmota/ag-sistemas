import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Injectable()
export class SchemaInitService implements OnModuleInit {
  constructor(@InjectConnection() private sequelize: Sequelize) {}

  async onModuleInit() {
    const qi = this.sequelize.getQueryInterface();
    try {
      const desc = await qi.describeTable('usuarios');
      if (!('nome' in desc)) {
        await qi.addColumn('usuarios', 'nome', { type: DataTypes.STRING, allowNull: true });
        // eslint-disable-next-line no-console
        console.log('[SchemaInit] Adicionada coluna usuarios.nome');
      }
      if (!('empresa' in desc)) {
        await qi.addColumn('usuarios', 'empresa', { type: DataTypes.STRING, allowNull: true });
        // eslint-disable-next-line no-console
        console.log('[SchemaInit] Adicionada coluna usuarios.empresa');
      }
      // Adiciona coluna de ativação em usuarios
      if (!('ativo' in desc)) {
        await qi.addColumn('usuarios', 'ativo', { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true });
        // eslint-disable-next-line no-console
        console.log('[SchemaInit] Adicionada coluna usuarios.ativo');
        try {
          await this.sequelize.query(
            `UPDATE usuarios SET ativo = 1 WHERE ativo IS NULL;`
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[SchemaInit] Falha ao backfill usuarios.ativo para 1 (true):', e);
        }
      }
      // Backfill inicial: preenche usuarios.nome/empresa a partir de membros por email, quando ausente
      try {
        // Garante existência das tabelas antes de tentar o backfill
        let hasUsuarios = true;
        let hasMembros = true;
        try { await qi.describeTable('usuarios'); } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table') || msg.includes('No description found')) {
            hasUsuarios = false;
          } else { throw e; }
        }
        try { await qi.describeTable('membros'); } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table') || msg.includes('No description found')) {
            hasMembros = false;
          } else { throw e; }
        }

        if (hasUsuarios && hasMembros) {
          await this.sequelize.query(
            `UPDATE usuarios AS u
             SET nome = (
               SELECT m.nome FROM membros AS m WHERE m.email = u.email
             )
             WHERE u.nome IS NULL AND EXISTS (
               SELECT 1 FROM membros m WHERE m.email = u.email AND m.nome IS NOT NULL
             );`
          );
          await this.sequelize.query(
            `UPDATE usuarios AS u
             SET empresa = (
               SELECT m.empresa FROM membros AS m WHERE m.email = u.email
             )
             WHERE u.empresa IS NULL AND EXISTS (
               SELECT 1 FROM membros m WHERE m.email = u.email AND m.empresa IS NOT NULL
             );`
          );
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Backfill de usuarios.nome/empresa concluído');
        } else {
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Pulando backfill usuarios.nome/empresa; tabelas ausentes em ambiente in-memory/pré-sync.');
        }
      } catch (bfErr: any) {
        const msg = String(bfErr?.parent?.message || bfErr?.message || '');
        // Silencia erros esperados em ambientes in-memory/pré-sync
        if (msg.includes('no such table') || msg.includes('No description found')) {
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Backfill usuarios.nome/empresa ignorado: tabelas ausentes.');
        } else {
          // eslint-disable-next-line no-console
          console.warn('[SchemaInit] Falha no backfill de usuarios.nome/empresa:', bfErr);
        }
      }

      // Adiciona coluna usuario_id em mensalidades e remove membro_id
      try {
        let mensalidadesDesc: any = null;
        try {
          mensalidadesDesc = await qi.describeTable('mensalidades');
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table') || msg.includes('No description found')) {
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] mensalidades ausente; sync criará. Pulando migração por enquanto.');
            mensalidadesDesc = null;
          } else {
            throw e;
          }
        }
        if (mensalidadesDesc) {
          // Remove coluna membro_id se existir
          if ('membro_id' in mensalidadesDesc) {
            await qi.removeColumn('mensalidades', 'membro_id');
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Removida coluna mensalidades.membro_id');
          }
          if (!('usuario_id' in mensalidadesDesc)) {
            await qi.addColumn('mensalidades', 'usuario_id', { type: DataTypes.INTEGER, allowNull: true });
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Adicionada coluna mensalidades.usuario_id');
          }
          // Após remoção de membro_id, não há backfill baseado em membro; futuras mensalidades usarão usuario_id
        }
      } catch (feesErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao adicionar/backfill mensalidades.usuario_id:', feesErr);
      }

      // Atualiza tabela de indicacoes para usar usuarios em vez de membros
      try {
        let indicacoesDesc: any = null;
        try {
          indicacoesDesc = await qi.describeTable('indicacoes');
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table') || msg.includes('No description found')) {
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] indicacoes ausente; sync criará. Pulando migração por enquanto.');
            indicacoesDesc = null;
          } else {
            throw e;
          }
        }
        if (indicacoesDesc) {
          if (!('usuario_origem_id' in indicacoesDesc)) {
            await qi.addColumn('indicacoes', 'usuario_origem_id', { type: DataTypes.INTEGER, allowNull: true });
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Adicionada coluna indicacoes.usuario_origem_id');
          }
          if (!('usuario_destino_id' in indicacoesDesc)) {
            await qi.addColumn('indicacoes', 'usuario_destino_id', { type: DataTypes.INTEGER, allowNull: true });
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Adicionada coluna indicacoes.usuario_destino_id');
          }
          // Backfill: mapeia membros -> usuarios via email para preencher usuario_* quando possível
          if ('membro_origem_id' in indicacoesDesc) {
            await this.sequelize.query(
              `UPDATE indicacoes AS i
               SET usuario_origem_id = (
                 SELECT u.id FROM usuarios AS u
                 WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = i.membro_origem_id)
               )
               WHERE usuario_origem_id IS NULL AND membro_origem_id IS NOT NULL;`
            );
          }
          if ('membro_destino_id' in indicacoesDesc) {
            await this.sequelize.query(
              `UPDATE indicacoes AS i
               SET usuario_destino_id = (
                 SELECT u.id FROM usuarios AS u
                 WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = i.membro_destino_id)
               )
               WHERE usuario_destino_id IS NULL AND membro_destino_id IS NOT NULL;`
            );
          }
          // Após backfill, defina como NOT NULL se desejar e remova colunas antigas
          try {
            const indicacoesDescAfter = await qi.describeTable('indicacoes');
            if ('membro_origem_id' in indicacoesDescAfter) {
              await qi.removeColumn('indicacoes', 'membro_origem_id');
              // eslint-disable-next-line no-console
              console.log('[SchemaInit] Removida coluna indicacoes.membro_origem_id');
            }
            if ('membro_destino_id' in indicacoesDescAfter) {
              await qi.removeColumn('indicacoes', 'membro_destino_id');
              // eslint-disable-next-line no-console
              console.log('[SchemaInit] Removida coluna indicacoes.membro_destino_id');
            }
          } catch (e2: any) {
            const msg2 = String(e2?.parent?.message || e2?.message || '');
            if (msg2.includes('no such table') || msg2.includes('No description found')) {
              // Tabela pode ter sido removida/criada durante sync; ignorar
            } else {
              throw e2;
            }
          }
        }
      } catch (indicErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao migrar indicacoes para usuarios:', indicErr);
      }

      // Atualiza tabela de obrigados para usar usuario_id em vez de membro_id
      try {
        let obrigadosDesc: any = null;
        try {
          obrigadosDesc = await qi.describeTable('obrigados');
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table') || msg.includes('No description found')) {
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] obrigados ausente; sync criará. Pulando migração por enquanto.');
            obrigadosDesc = null;
          } else {
            throw e;
          }
        }
        if (obrigadosDesc) {
          if (!('usuario_id' in obrigadosDesc)) {
            await qi.addColumn('obrigados', 'usuario_id', { type: DataTypes.INTEGER, allowNull: true });
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Adicionada coluna obrigados.usuario_id');
          }
          // Backfill: mapeia membro_id -> usuario_id via email, somente se coluna membro_id existir
          if ('membro_id' in obrigadosDesc) {
            await this.sequelize.query(
              `UPDATE obrigados AS o
               SET usuario_id = (
                 SELECT u.id FROM usuarios AS u
                 WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = o.membro_id)
               )
               WHERE usuario_id IS NULL AND membro_id IS NOT NULL;`
            );
          }
          try {
            const obrigadosDescAfter = await qi.describeTable('obrigados');
            if ('membro_id' in obrigadosDescAfter) {
              await qi.removeColumn('obrigados', 'membro_id');
              // eslint-disable-next-line no-console
              console.log('[SchemaInit] Removida coluna obrigados.membro_id');
            }
          } catch (e2: any) {
            const msg2 = String(e2?.parent?.message || e2?.message || '');
            if (msg2.includes('no such table') || msg2.includes('No description found')) {
              // Ignora ausência pós-sync
            } else {
              throw e2;
            }
          }
        }
      } catch (obrigErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao migrar obrigados para usuario_id:', obrigErr);
      }

      // Migrar tabela de planos de membros para planos de usuários
      try {
        // Renomeia tabela se necessário
        try {
          await qi.describeTable('membro_planos');
          // Se tabela antiga existe, renomeia para usuario_planos
          // Verifica se a nova já não existe para evitar erro
          let hasUsuarioPlanos = true;
          try { await qi.describeTable('usuario_planos'); } catch { hasUsuarioPlanos = false; }
          if (!hasUsuarioPlanos) {
            await qi.renameTable('membro_planos', 'usuario_planos');
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Renomeada tabela membro_planos -> usuario_planos');
          }
        } catch {
          // Tabela membro_planos não existe; segue
        }

        let upDesc: any = null;
        try {
          upDesc = await qi.describeTable('usuario_planos');
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          // Ignora caso tabela ainda não exista em ambientes in-memory ou pré-sync
          if (msg.includes('no such table') || msg.includes('No description found')) {
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] usuario_planos ausente; sync criará. Pulando migração por enquanto.');
            upDesc = null;
          } else {
            throw e;
          }
        }
        if (upDesc) {
          if (!('usuario_id' in upDesc)) {
            await qi.addColumn('usuario_planos', 'usuario_id', { type: DataTypes.INTEGER, allowNull: true });
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Adicionada coluna usuario_planos.usuario_id');
          }
          if ('membro_id' in upDesc) {
            // Backfill: mapeia membro_id -> usuario_id via email
            await this.sequelize.query(
              `UPDATE usuario_planos AS up
               SET usuario_id = (
                 SELECT u.id FROM usuarios AS u
                 WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = up.membro_id)
               )
               WHERE usuario_id IS NULL AND membro_id IS NOT NULL;`
            );
            await qi.removeColumn('usuario_planos', 'membro_id');
            // eslint-disable-next-line no-console
            console.log('[SchemaInit] Removida coluna usuario_planos.membro_id');
          }
        }
      } catch (mpErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao migrar membro_planos -> usuario_planos:', mpErr);
      }

      // Remover tabelas legadas que não devem mais existir
      try {
        // Remove membro_planos se ainda existir (por ambientes antigos)
        try {
          await qi.describeTable('membro_planos');
          await qi.dropTable('membro_planos');
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Removida tabela legada membro_planos');
        } catch {
          // não existe
        }
        // Remove usuarios_backup se existir
        try {
          await qi.describeTable('usuarios_backup');
          await qi.dropTable('usuarios_backup');
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Removida tabela legada usuarios_backup');
        } catch {
          // não existe
        }
      } catch (legacyErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao remover tabelas legadas:', legacyErr);
      }

      // Garante coluna 'ativo' na tabela de planos
      try {
        const planosDesc = await qi.describeTable('planos');
        if (planosDesc && !('ativo' in planosDesc)) {
          await qi.addColumn('planos', 'ativo', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Adicionada coluna planos.ativo');
        }
      } catch (ePlan: any) {
        const msgPlan = String(ePlan?.parent?.message || ePlan?.message || '');
        if (msgPlan.includes('no such table') || msgPlan.includes('No description found')) {
          // Tabela ainda não criada — sync cuidará
        } else {
          throw ePlan;
        }
      }
    } catch (e: any) {
      const msg = String(e?.parent?.message || e?.message || '');
      if (msg.includes('no such table') || msg.includes('No description found')) {
        // Tabela ainda não criada (primeira inicialização) — sync do Sequelize cuidará depois
        return;
      }
      // eslint-disable-next-line no-console
      console.error('[SchemaInit] Falha ao verificar/adicionar colunas usuarios.nome/empresa:', e);
    }
  }
}