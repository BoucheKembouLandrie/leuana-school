import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const sendSuggestion = async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        // Create transporter (support generic SMTP or Gmail)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER || 'suggestion@bokeland.com',
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Email options
        const mailOptions = {
            from: 'suggestion@bokeland.com',
            to: 'client-form@bokeland.com',
            subject: 'boite à suggestion du logiciel scolaire',
            text: `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>Nouvelle suggestion - Logiciel Scolaire</h3>
                <p><strong>Nom:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Suggestion envoyée avec succès' });
    } catch (error) {
        console.error('Error sending suggestion:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de la suggestion' });
    }
};
