import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Teacher from './Teacher';
import Class from './Class';

class Subject extends Model {
    public id!: number;
    public nom!: string;
    public teacher_id!: number;
    public classe_id!: number;
    public coefficient!: number;
}

Subject.init(
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
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: Teacher,
                key: 'id',
            },
        },
        classe_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Class,
                key: 'id',
            },
        },
        coefficient: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        sequelize,
        tableName: 'subjects',
    }
);

export default Subject;
