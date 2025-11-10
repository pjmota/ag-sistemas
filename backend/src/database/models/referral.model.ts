import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'indicacoes' })
export class Referral extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_origem_id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_destino_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  descricao!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'nova' })
  status!: 'nova' | 'em contato' | 'fechada' | 'recusada';

  @Column({ type: DataType.TEXT, allowNull: true })
  agradecimentos_publicos?: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  data!: Date;
}