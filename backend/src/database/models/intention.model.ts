import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'intencoes' })
export class Intention extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  nome!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  empresa?: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  motivo!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'pendente' })
  status!: 'pendente' | 'aprovada' | 'recusada';

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  data!: Date;
}