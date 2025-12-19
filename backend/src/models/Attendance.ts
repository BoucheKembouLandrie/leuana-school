import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';

class Attendance extends Model {
    public id!: number;
    public eleve_id!: number;
    public date!: Date;
    public statut!: 'present' | 'absent' | 'retard' | 'excuse';
    public motif!: string;
    public time!: string;
    public school_year_id!: number;
}

Attendance.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        eleve_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Student,
                key: 'id',
            },
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        statut: {
            type: DataTypes.ENUM('present', 'absent', 'retard', 'excuse'),
            allowNull: false,
        },
        motif: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: true,
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
        tableName: 'attendance',
    }
);

export default Attendance;
