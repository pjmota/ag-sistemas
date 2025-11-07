import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'convites' })
export class Invite extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  token!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  intention_id!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  expires_at?: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  used!: boolean;
}