import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailsService.name);

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });
            this.logger.log('SMTP Configured successfully');
        } else {
            this.logger.warn('SMTP Not configured. Emails will be logged to console only.');
        }
    }

    async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
        const from = this.configService.get<string>('SMTP_FROM') || '"DIGITAL PARADISE" <noreply@caribedigital.cr>';

        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, html, attachments });
                this.logger.log(`Email sent to ${to}: ${subject} ${attachments ? `(with ${attachments.length} attachments)` : ''}`);
            } catch (error) {
                this.logger.error(`Failed to send email to ${to}`, error.stack);
            }
        } else {
            this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Attachments: ${attachments?.map(a => a.filename).join(', ') || 'None'}`);
        }
    }

    async sendVerificationEmail(to: string, name: string, token: string) {
        const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

        const subject = 'Verifica tu cuenta - DIGITAL PARADISE';
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #00FF66;">¡Bienvenido, ${name}!</h2>
                <p>Gracias por unirte a DIGITAL PARADISE. Por favor, verifica tu cuenta haciendo clic en el botón de abajo:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verifyUrl}" style="background-color: #00FF66; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar Cuenta</a>
                </div>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="color: #666; font-size: 12px;">${verifyUrl}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 10px; color: #999;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
            </div>
        `;
        await this.sendEmail(to, subject, html);
    }

    async sendPasswordResetEmail(to: string, name: string, token: string) {
        const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        const subject = 'Restablece tu contraseña - DIGITAL PARADISE';
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #00FF66;">Hola, ${name}</h2>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #00FF66; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                </div>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="color: #666; font-size: 12px;">${resetUrl}</p>
                <p>Este enlace expirará en 1 hora.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 10px; color: #999;">Si no solicitaste este cambio, por favor contacta a soporte.</p>
            </div>
        `;
        await this.sendEmail(to, subject, html);
    }
}
