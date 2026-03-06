# EduPortal – Student & Teacher Login

Login and sign-up page for students and teachers, with quotes and MongoDB Atlas backend.

## What to do next (MongoDB Atlas)

Security note: keep your DB password in `.env` only (don’t paste/share it). If you already shared it, rotate it in Atlas.

1. **Get your connection string**
   - In Atlas: click **Connect** on your cluster (Cluster0).
   - Choose **Drivers** → **Node.js**.
   - Copy the connection string (e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/...`).

2. **Database user & password**
   - In Atlas: **Database Access** → create a user (or use existing). Note the username and password.
   - In the connection string, replace `<password>` with that password (and `<username>` if present).

3. **Network access**
   - In Atlas: **Network Access** → **Add IP Address**.
   - For local dev you can use **Allow Access from Anywhere** (`0.0.0.0/0`). For production, restrict to your server IP.

4. **Create `.env` in this folder**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Use your real cluster hostname from the Atlas connection string.

## Run the app

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser. The login/signup forms will use the API and store users in MongoDB.

- **Student Login / Teacher Login** → sign in (checks role).
- **Student Sign Up / Teacher Sign Up** → create account (role stored in DB).

Users are stored in the `users` collection (created automatically) with hashed passwords.
