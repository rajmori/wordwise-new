import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send contact form email to ifusetech@gmail.com
 */
export const sendContactEmail = async (req, res) => {
    try {
        const { name, email, message, honeypot } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }

        // Bot detection - honeypot field should be empty
        if (honeypot) {
            console.log('🤖 Bot detected, ignoring submission');
            return res.status(400).json({
                success: false,
                message: 'Invalid submission'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content to send to ifusetech@gmail.com
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'ifusetech@gmail.com',
            subject: `WordWise Contact Form: Message from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">WordWise Contact Form</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">New message received</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <div style="margin-bottom: 25px;">
                            <h3 style="color: #6366f1; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">From</h3>
                            <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: 600;">${name}</p>
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <h3 style="color: #6366f1; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Email</h3>
                            <p style="margin: 0; font-size: 16px; color: #4b5563;">
                                <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a>
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <h3 style="color: #6366f1; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Message</h3>
                            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1;">
                                <p style="margin: 0; font-size: 16px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 14px; color: #9ca3af; text-align: center;">
                                Sent from WordWise Contact Form<br>
                                <span style="font-size: 12px;">${new Date().toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px;">
                            Reply to ${name}
                        </a>
                    </div>
                </div>
            `,
            text: `
WordWise Contact Form - New Message

From: ${name}
Email: ${email}

Message:
${message}

---
Sent: ${new Date().toLocaleString()}
Reply to: ${email}
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        console.log(`✅ Contact email sent to ifusetech@gmail.com from ${name} (${email})`);

        res.json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('❌ Contact Email Error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
};

