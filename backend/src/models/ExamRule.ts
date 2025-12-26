import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ExamRule extends Model {
    public id!: number;
    public category!: string;
    public min_average!: number;
    public max_average!: number;
    public min_absence!: number;
    public max_absence!: number;
    public status!: string;
    public schoolYearId!: number;
}

ExamRule.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        min_average: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        max_average: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        min_absence: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        max_absence: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 999,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schoolYearId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'school_year_id'
        }
    },
    {
        sequelize,
        tableName: 'exam_rules',
    }
);

export default ExamRule;
