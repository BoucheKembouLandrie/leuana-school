import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Teacher extends Model {
    public id!: number;
    public nom!: string;
    public prenom!: string;
    public tel!: string;
    public email!: string;
    public salaire!: number;
    public school_year_id!: number;
}

Teacher.init(
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
        prenom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        salaire: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
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
        tableName: 'teachers',
    }
);

export default Teacher;
