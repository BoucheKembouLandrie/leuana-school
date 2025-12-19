import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Class extends Model {
    public id!: number;
    public libelle!: string;
    public niveau!: string;
    public annee!: string;
    public pension!: number;
    public school_year_id!: number;
}

Class.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        libelle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        niveau: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        annee: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        pension: {
            type: DataTypes.DECIMAL(10, 2),
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
        tableName: 'classes',
    }
);

export default Class;
