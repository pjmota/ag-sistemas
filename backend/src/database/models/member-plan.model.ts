import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'usuario_planos' })
export class MemberPlan extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  plano_id!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  data_inicio!: Date;
}