# 📧 Contact Form Email Service - Complete Setup Guide

## ✅ What Was Implemented

A complete middleware service that sends contact form submissions from your website to **ifusetech@gmail.com** using Nodemailer.

---

## 🎯 Features

- ✅ **Automatic Email Delivery** - All contact form submissions are sent to `ifusetech@gmail.com`
- ✅ **Beautiful HTML Email Template** - Professional, branded email design with WordWise gradient
- ✅ **Bot Protection** - Honeypot field to prevent spam submissions
- ✅ **Form Validation** - Client-side and server-side validation
- ✅ **Error Handling** - Comprehensive error messages for users
- ✅ **Loading States** - Visual feedback during submission
- ✅ **Success Confirmation** - User-friendly success message after submission

---

## 📁 Files Created/Modified

### **Backend Files:**
1. **`server/controllers/contactController.js`** - Email sending logic
2. **`server/routes/contactRoutes.js`** - Contact API route
3. **`server/server.js`** - Added contact route to Express app
4. **`server/.env`** - Added email configuration variables

### **Frontend Files:**
1. **`contact-service.js`** - Frontend service to call contact API
2. **`main.js`** - Updated to use real API instead of mock submission

---

## 🔧 Email Configuration Setup

### **Step 1: Generate Gmail App Password**

Since you want to send emails to `ifusetech@gmail.com`, you need to configure a Gmail account to send FROM.

**Option A: Use ifusetech@gmail.com to send to itself**
1. Go to https://myaccount.google.com/apppasswords
2. Sign in with `ifusetech@gmail.com`
3. Create a new App Password:
   - App name: "WordWise Contact Form"
   - Click "Create"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

**Option B: Use a different Gmail account to send to ifusetech@gmail.com**
1. Use any Gmail account you control
2. Follow the same steps above
3. The emails will be sent FROM this account TO `ifusetech@gmail.com`

### **Step 2: Update Environment Variables**

Edit `server/.env` file and update these lines:

```env
# Email Configuration (for Contact Form)
EMAIL_USER=ifusetech@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
```

**Example:**
```env
EMAIL_USER=ifusetech@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

⚠️ **Important:** 
- Remove spaces from the app password: `abcdefghijklmnop`
- Do NOT use your regular Gmail password
- Use the App Password generated in Step 1

### **Step 3: Restart Backend Server**

After updating `.env`, restart the backend:

```bash
cd server
npm run dev
```

---

## 🧪 Testing the Contact Form

### **Test 1: Frontend Form Submission**

1. Open http://localhost:5173/contact.html
2. Fill out the form:
   - **Name:** John Doe
   - **Email:** john@example.com
   - **Message:** This is a test message
3. Click "Send Message"
4. You should see:
   - Loading spinner while sending
   - Success message: "Message Sent! Thank you for contacting us."
5. Check `ifusetech@gmail.com` inbox for the email

### **Test 2: API Endpoint Test**

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message from API",
    "honeypot": ""
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message sent successfully! We will get back to you soon."
}
```

---

## 📧 Email Template Preview

The email sent to `ifusetech@gmail.com` includes:

```
┌─────────────────────────────────────┐
│   WordWise Contact Form             │
│   New message received              │
├─────────────────────────────────────┤
│ FROM                                │
│ John Doe                            │
│                                     │
│ EMAIL                               │
│ john@example.com                    │
│                                     │
│ MESSAGE                             │
│ ┌─────────────────────────────────┐ │
│ │ This is a test message          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Sent: 12/16/2025, 12:00:00 PM      │
├─────────────────────────────────────┤
│      [Reply to John Doe]            │
└─────────────────────────────────────┘
```

---

## 🔒 Security Features

1. **Honeypot Field** - Hidden field that bots fill out, legitimate users don't see
2. **Email Validation** - Regex validation on both client and server
3. **Input Sanitization** - All inputs are validated before processing
4. **Rate Limiting** - Can be added later if needed
5. **CORS Protection** - Only allowed origins can submit

---

## 🚨 Troubleshooting

### **Error: "Invalid login: Username and Password not accepted"**

**Solution:** You need to configure Gmail App Password in `.env` file (see Step 2 above)

### **Error: "Failed to send message"**

**Possible causes:**
1. Email credentials not configured in `.env`
2. Backend server not restarted after updating `.env`
3. Gmail App Password incorrect
4. Network/firewall blocking SMTP connection

**Check server logs:**
```bash
# Look for error messages in the terminal running the backend
```

### **Email not received at ifusetech@gmail.com**

1. Check spam/junk folder
2. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
3. Check server logs for errors
4. Test with curl command (see Test 2 above)

---

## 📊 API Documentation

### **POST /api/contact**

Send contact form submission to ifusetech@gmail.com

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I have a question about WordWise...",
  "honeypot": ""
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully! We will get back to you soon."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Please provide name, email, and message"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Failed to send message. Please try again later."
}
```

---

## ✨ Next Steps

1. **Configure Email Credentials** - Update `server/.env` with Gmail App Password
2. **Test the Form** - Submit a test message from http://localhost:5173/contact.html
3. **Check Email** - Verify email arrives at `ifusetech@gmail.com`
4. **Customize Template** (Optional) - Edit `server/controllers/contactController.js` to change email design

---

**Your contact form is now ready to send emails to ifusetech@gmail.com!** 🎉

Just configure the Gmail App Password and restart the server to start receiving contact form submissions.

