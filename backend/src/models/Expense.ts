import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Expense extends Model {
    public id!: number;
    public titre!: string;
    public montant!: number;
    public date_depense!: string;
    public description!: string;
    public category!: 'generale' | 'salaire';
    public status!: 'payé' | 'en_attente';
    public teacher_id?: number;
    public staff_id?: number;
    public school_year_id!: number;
}

Expense.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        titre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        montant: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        date_depense: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        category: {
            type: DataTypes.ENUM('generale', 'salaire'),
            allowNull: false,
            defaultValue: 'generale',
        },
        status: {
            type: DataTypes.ENUM('payé', 'en_attente'),
            allowNull: false,
            defaultValue: 'payé',
        },
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'teachers',
                key: 'id',
            },
        },
        staff_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'id',
            },
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
        tableName: 'expenses',
    }
);

export default Expense;
