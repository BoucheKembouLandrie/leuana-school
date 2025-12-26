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
    public school_year_id!: number;
    // Associations
    public teacher?: any; // optional Teacher instance
    public class?: any; // optional Class instance
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
            allowNull: true,
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
        tableName: 'subjects',
    }
);

export default Subject;
