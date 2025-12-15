import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';
import Subject from './Subject';

class Grade extends Model {
    public id!: number;
    public eleve_id!: number;
    public matiere_id!: number;
    public note!: number;
    public trimestre!: string;
    public annee_scolaire!: string;
}

Grade.init(
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
        matiere_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Subject,
                key: 'id',
            },
        },
        note: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0,
                max: 20,
            },
        },
        trimestre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        annee_scolaire: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'grades',
    }
);

export default Grade;
