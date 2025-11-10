import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'membros' })
export class Member extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  nome!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  telefone?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  empresa?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cargo?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  bio_area_atuacao?: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'pendente' })
  status!: 'pendente' | 'ativo' | 'recusado';

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  data_cadastro!: Date;
}