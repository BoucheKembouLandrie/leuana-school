import { Request, Response } from 'express';
import { SchoolSettings } from '../models';
import path from 'path';
import fs from 'fs';

export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await SchoolSettings.findOne();
        if (!settings) {
            settings = await SchoolSettings.create({
                school_name: 'LEUANA SCHOOL',
                website: 'https://leuanaschool.com',
                address: 'situé à carrefour bata nlongkak',
                phone: '+237690189297',
                logo_url: ''
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { school_name, website, address, phone, email } = req.body;
        let settings = await SchoolSettings.findOne();

        if (!settings) {
            settings = await SchoolSettings.create(req.body);
        } else {
            await settings.update({ school_name, website, address, phone, email });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
};

export const uploadLogo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const logoUrl = `/uploads/${req.file.filename}`;

        let settings = await SchoolSettings.findOne();
        if (!settings) {
            settings = await SchoolSettings.create({ logo_url: logoUrl });
        } else {
            // Optional: Delete old logo if exists
            // Delete old logo if exists
            if (settings.logo_url) {
                // Remove leading slash if present to ensure path.join treats it as relative
                const relativePath = settings.logo_url.startsWith('/') ? settings.logo_url.substring(1) : settings.logo_url;
                const oldPath = path.join(__dirname, '../../', relativePath);
                console.log('Attempting to delete old logo at:', oldPath);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                        console.log('Old logo deleted successfully');
                    } catch (err) {
                        console.error('Error deleting old logo:', err);
                    }
                } else {
                    console.log('Old logo file not found at:', oldPath);
                }
            }
            await settings.update({ logo_url: logoUrl });
        }

        res.json({ logo_url: logoUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading logo', error });
    }
};
