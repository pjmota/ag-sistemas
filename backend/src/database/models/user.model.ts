import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'usuarios' })
export class User extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  nome?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  empresa?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  senha_hash!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  role!: 'admin' | 'membro';

  @Column({ type: DataType.STRING, allowNull: true })
  telefone?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cargo?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  bio_area_atuacao?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
  ativo?: boolean;
}