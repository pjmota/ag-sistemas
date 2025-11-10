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
      // Backfill inicial: preenche usuarios.nome/empresa a partir de membros por email, quando ausente
      try {
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
      } catch (bfErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha no backfill de usuarios.nome/empresa:', bfErr);
      }

      // Adiciona coluna usuario_id em mensalidades e remove membro_id
      try {
        const mensalidadesDesc = await qi.describeTable('mensalidades');
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
      } catch (feesErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao adicionar/backfill mensalidades.usuario_id:', feesErr);
      }

      // Atualiza tabela de indicacoes para usar usuarios em vez de membros
      try {
        const indicacoesDesc = await qi.describeTable('indicacoes');
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
        await this.sequelize.query(
          `UPDATE indicacoes AS i
           SET usuario_origem_id = (
             SELECT u.id FROM usuarios AS u
             WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = i.membro_origem_id)
           )
           WHERE usuario_origem_id IS NULL AND membro_origem_id IS NOT NULL;`
        );
        await this.sequelize.query(
          `UPDATE indicacoes AS i
           SET usuario_destino_id = (
             SELECT u.id FROM usuarios AS u
             WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = i.membro_destino_id)
           )
           WHERE usuario_destino_id IS NULL AND membro_destino_id IS NOT NULL;`
        );
        // Após backfill, defina como NOT NULL se desejar e remova colunas antigas
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
      } catch (indicErr) {
        // eslint-disable-next-line no-console
        console.warn('[SchemaInit] Falha ao migrar indicacoes para usuarios:', indicErr);
      }

      // Atualiza tabela de obrigados para usar usuario_id em vez de membro_id
      try {
        const obrigadosDesc = await qi.describeTable('obrigados');
        if (!('usuario_id' in obrigadosDesc)) {
          await qi.addColumn('obrigados', 'usuario_id', { type: DataTypes.INTEGER, allowNull: true });
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Adicionada coluna obrigados.usuario_id');
        }
        // Backfill: mapeia membro_id -> usuario_id via email
        await this.sequelize.query(
          `UPDATE obrigados AS o
           SET usuario_id = (
             SELECT u.id FROM usuarios AS u
             WHERE u.email = (SELECT m.email FROM membros AS m WHERE m.id = o.membro_id)
           )
           WHERE usuario_id IS NULL AND membro_id IS NOT NULL;`
        );
        const obrigadosDescAfter = await qi.describeTable('obrigados');
        if ('membro_id' in obrigadosDescAfter) {
          await qi.removeColumn('obrigados', 'membro_id');
          // eslint-disable-next-line no-console
          console.log('[SchemaInit] Removida coluna obrigados.membro_id');
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

        const upDesc = await qi.describeTable('usuario_planos');
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
    } catch (e: any) {
      const msg = String(e?.parent?.message || e?.message || '');
      if (msg.includes('no such table')) {
        // Tabela ainda não criada (primeira inicialização) — sync do Sequelize cuidará depois
        return;
      }
      // eslint-disable-next-line no-console
      console.error('[SchemaInit] Falha ao verificar/adicionar colunas usuarios.nome/empresa:', e);
    }
  }
}