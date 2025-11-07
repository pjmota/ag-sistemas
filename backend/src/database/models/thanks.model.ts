import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'obrigados' })
export class Thanks extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  membro_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  descricao!: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  data!: Date;
}