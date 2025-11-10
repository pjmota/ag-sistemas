import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type FeeStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

@Table({ tableName: 'mensalidades' })
export class Fee extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  usuario_id?: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  valor!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  vencimento!: Date;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'pendente' })
  status!: FeeStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  data_pagamento?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  observacao?: string;
}