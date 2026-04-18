import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
    try {
        let transporter;

        // Use Console/Ethereal for Dev if no real credentials
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ No EMAIL_USER/PASS found. Using Ethereal (Dev Mode).');

            // Create a test account (only needed once, but fine for dev)
            let testAccount = await nodemailer.createTestAccount();

            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
        } else {
            // Production / Real SMTP
            transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'Gmail', // e.g., 'Gmail', 'SendGrid'
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        }

        const info = await transporter.sendMail({
            from: '"WordWise Support" <no-reply@wordwise.com>',
            to,
            subject,
            html,
        });

        console.log('📧 Email sent: %s', info.messageId);

        // Preview only available when sending through an Ethereal account
        if (nodemailer.getTestMessageUrl(info)) {
            console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw new Error('Email sending failed');
    }
};

export default sendEmail;
