# 🔧 Fix Google OAuth "Access Blocked" Error

## ❌ Current Error
```
Access blocked: Authorization Error
Error 400: redirect_uri_mismatch
```

---

## 🎯 Solution: Configure Google Cloud Console

### **Step 1: Go to Google Cloud Console**

1. Open: https://console.cloud.google.com/
2. Select your project (or create a new one)

---

### **Step 2: Enable Google+ API**

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click **Enable**

---

### **Step 3: Configure OAuth Consent Screen**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for testing) or **Internal** (for organization)
3. Click **Create**

**Fill in the required fields:**
- **App name:** WordWise
- **User support email:** Your email (e.g., ifusetech@gmail.com)
- **Developer contact email:** Your email

**Scopes:**
- Add these scopes:
  - `openid`
  - `email`
  - `profile`

**Test users (if in Testing mode):**
- Add your email address as a test user
- Add any other emails you want to test with

4. Click **Save and Continue**
5. Click **Back to Dashboard**

---

### **Step 4: Configure Authorized Redirect URIs**

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID (the one starting with `740316754976-...`)
3. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:5173
   http://localhost:4173
   http://localhost:3000
   ```

4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173/login.html
   http://localhost:4173/login.html
   http://localhost:5173/
   http://localhost:4173/
   ```

5. Click **Save**

---

### **Step 5: Publish App (Optional)**

If you want anyone to be able to sign in (not just test users):

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Confirm the publishing

**Note:** If your app is in "Testing" mode, only test users can sign in.

---

## 🔍 Current Configuration

**Your Google Client ID:**
```
287458285838-njhhmnitf8k6des5gjvve0qm6c9dmvmo.apps.googleusercontent.com
```

**Required Redirect URIs:**
- Development: `http://localhost:5173/login.html`
- Production Preview: `http://localhost:4173/login.html`
- Alternative: `http://localhost:5173/`
- Alternative: `http://localhost:4173/`

**Required JavaScript Origins:**
- `http://localhost:5173`
- `http://localhost:4173`
- `http://localhost:3000`

---

## ✅ Quick Fix Checklist

- [ ] Go to Google Cloud Console
- [ ] Enable Google+ API or Google Identity
- [ ] Configure OAuth consent screen
- [ ] Add test users (if in Testing mode)
- [ ] Add authorized JavaScript origins
- [ ] Add authorized redirect URIs
- [ ] Save changes
- [ ] Wait 5 minutes for changes to propagate
- [ ] Clear browser cache
- [ ] Try signing in again

---

## 🚀 After Configuration

Once you've completed the steps above:

1. **Wait 5 minutes** for Google to propagate the changes
2. **Clear your browser cache** (or use incognito mode)
3. **Try signing in again** at http://localhost:4173/login.html

---

## 🔗 Useful Links

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Credentials:** https://console.cloud.google.com/apis/credentials
- **API Library:** https://console.cloud.google.com/apis/library

---

## 📝 Alternative: Create New OAuth Client

If you can't access the existing OAuth client, create a new one:

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. **Name:** WordWise Local Development
5. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `http://localhost:4173`
6. **Authorized redirect URIs:**
   - `http://localhost:5173/login.html`
   - `http://localhost:4173/login.html`
7. Click **Create**
8. Copy the new Client ID
9. Update `config.js` with the new Client ID

---

## 🐛 Troubleshooting

### Error: "This app is blocked"
- **Solution:** Publish the app or add yourself as a test user

### Error: "redirect_uri_mismatch"
- **Solution:** Make sure the redirect URI in Google Console exactly matches the one in your app

### Error: "Access blocked: This app's request is invalid"
- **Solution:** Check that all required scopes are configured

### Still not working?
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Wait 5-10 minutes after making changes
- Check browser console for detailed error messages

---

## 📞 Need Help?

If you're still having issues, please provide:
1. Screenshot of the error
2. Screenshot of your OAuth consent screen settings
3. Screenshot of your authorized redirect URIs
4. Browser console errors (F12 → Console tab)

