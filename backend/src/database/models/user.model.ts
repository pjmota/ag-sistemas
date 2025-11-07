import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'usuarios' })
export class User extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  senha_hash!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  role!: 'admin' | 'membro';
}