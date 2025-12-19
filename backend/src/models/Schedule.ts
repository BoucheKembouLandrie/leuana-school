import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Schedule extends Model {
    public id!: number;
    public classe_id!: number;
    public subject_id!: number;
    public day_of_week!: number; // 1=Monday, 2=Tuesday, ..., 6=Saturday
    public start_time!: string; // HH:MM format
    public end_time!: string; // HH:MM format
    public school_year_id!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Schedule.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        classe_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'classes',
                key: 'id',
            },
        },
        subject_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'subjects',
                key: 'id',
            },
        },
        day_of_week: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 6,
            },
        },
        start_time: {
            type: DataTypes.STRING(5),
            allowNull: false,
        },
        end_time: {
            type: DataTypes.STRING(5),
            allowNull: false,
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
        tableName: 'schedules',
    }
);

export default Schedule;
