import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class SchoolYear extends Model {
    public id!: number;
    public name!: string;           // "2024-2025"
    public start_year!: number;     // 2024
    public end_year!: number;       // 2025
    public is_active!: boolean;     // Only one active year at a time
}

SchoolYear.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                is: /^\d{4}-\d{4}$/,  // Format: YYYY-YYYY
            },
        },
        startYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'start_year', // Explicit mapping
            validate: {
                min: 2000,
                max: 2100,
            },
        },
        endYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'end_year', // Explicit mapping
            validate: {
                min: 2000,
                max: 2100,
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_active', // Explicit mapping
        },
    },
    {
        sequelize,
        tableName: 'school_years',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    }
);

export default SchoolYear;
