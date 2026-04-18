# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended - Free & Easy)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email
3. Choose **FREE** tier (M0 Sandbox)

### Step 2: Create Cluster
1. After login, click **"Build a Database"**
2. Choose **FREE** tier (M0)
3. Select a cloud provider (AWS recommended)
4. Choose a region closest to you
5. Name your cluster (e.g., "WordWise")
6. Click **"Create"** (takes 3-5 minutes)

### Step 3: Create Database User
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `wordwise_admin`
5. Password: Generate a strong password (save it!)
6. Database User Privileges: **"Atlas admin"**
7. Click **"Add User"**

### Step 4: Allow Network Access
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://wordwise_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `mongodb+srv://wordwise_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/wordwise?retryWrites=true&w=majority`

### Step 6: Update .env File
1. Open `server/.env` file
2. Update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://wordwise_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/wordwise?retryWrites=true&w=majority
   ```
3. Save the file

### Step 7: Restart Backend Server
1. Stop the current server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. You should see: ✅ MongoDB Connected

---

## Option 2: Local MongoDB (Advanced)

### Windows
1. Download: https://www.mongodb.com/try/download/community
2. Run installer (choose Complete installation)
3. Install as Windows Service
4. MongoDB will run automatically
5. Connection string: `mongodb://localhost:27017/wordwise`

### Mac
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```
Connection string: `mongodb://localhost:27017/wordwise`

### Linux
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```
Connection string: `mongodb://localhost:27017/wordwise`

---

## Verify Connection

After updating `.env` and restarting the server, you should see:

```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 WordWise API Server running on port 5000
```

If you see this, you're ready to create courses! 🎉

---

## Troubleshooting

### "MongoServerError: bad auth"
- Check your username and password in connection string
- Ensure password doesn't contain special characters (use URL encoding)

### "Network timeout"
- Check Network Access settings in Atlas
- Ensure your IP is whitelisted

### "Cannot connect to localhost:27017"
- MongoDB service not running
- Start MongoDB service on your machine

---

## Next Steps

Once MongoDB is connected:
1. Login to admin panel: http://localhost:5173/admin/login.html
2. Go to "Courses" section
3. Create your first course!
4. All data will be saved to MongoDB
