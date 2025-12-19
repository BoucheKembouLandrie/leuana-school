import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Evaluation extends Model {
    public id!: number;
    public nom!: string;
    public date_debut!: string;
    public date_fin!: string;
    public ordre!: number;
    public school_year_id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Evaluation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        ordre: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        school_year_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'school_years',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'evaluations',
    }
);

export default Evaluation;
