import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const sendSuggestion = async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        // Create transporter using Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });

        // Email options
        const mailOptions = {
            from: email,
            to: 'bouchekembou@gmail.com',
            subject: `Suggestion de ${name} - Leuana School`,
            text: `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>Nouvelle suggestion - Leuana School</h3>
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
