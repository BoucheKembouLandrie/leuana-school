import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Class from './Class';

class Student extends Model {
    public id!: number;
    public matricule!: string;
    public nom!: string;
    public prenom!: string;
    public date_naissance!: Date;
    public sexe!: 'M' | 'F';
    public adresse!: string;
    public parent_tel!: string;
    public classe_id!: number;
    public date_inscription!: Date;
    public category!: string;
    public school_year_id!: number;
}

Student.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        matricule: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        prenom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date_naissance: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        sexe: {
            type: DataTypes.ENUM('M', 'F'),
            allowNull: false,
        },
        adresse: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        parent_tel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        classe_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Class,
                key: 'id',
            },
        },
        date_inscription: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Non redoublant(e)',
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
        tableName: 'students',
    }
);

export default Student;
