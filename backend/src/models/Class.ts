import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Class extends Model {
    public id!: number;
    public libelle!: string;
    public niveau!: string;
    public annee!: string;
    public pension!: number;
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
    },
    {
        sequelize,
        tableName: 'classes',
    }
);

export default Class;
