import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class SchoolSettings extends Model {
    public id!: number;
    public school_name!: string;
    public website!: string;
    public address!: string;
    public phone!: string;
    public email!: string;
    public logo_url!: string;
}

SchoolSettings.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    school_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    logo_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: 'school_settings',
});

export default SchoolSettings;
