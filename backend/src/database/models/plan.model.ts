import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'planos' })
export class Plan extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  nome!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  valor!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 10 })
  dia_vencimento_padrao!: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'mensal' })
  periodicidade!: 'mensal';

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  ativo!: boolean;
}