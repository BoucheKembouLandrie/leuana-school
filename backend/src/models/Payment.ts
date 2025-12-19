import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';

class Payment extends Model {
    public id!: number;
    public eleve_id!: number;
    public montant!: number;
    public date_paiement!: Date;
    public motif!: string;
    public reste!: number;
    public school_year_id!: number;
}

Payment.init(
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
        montant: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        date_paiement: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        motif: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reste: {
            type: DataTypes.FLOAT,
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
        tableName: 'payments',
    }
);

export default Payment;
