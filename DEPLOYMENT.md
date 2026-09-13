# 🚀 StudyFlow AI - Deployment & Hosting Guide

This guide details how to deploy **StudyFlow AI** to free and production hosting platforms.

---

## ⚡ Option 1: Deploy to Render (Recommended - Free Web Service)

Render provides free hosting with automatic GitHub integration.

1. **Push your repository to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy StudyFlow AI with Admin & Excel Live Sync"
   git push origin main
   ```
2. **Go to [render.com](https://render.com/)** and log in.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Set the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Plan**: `Free`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = *(Any secure 32+ character random string)*
   - `GEMINI_API_KEY` = *(Optional: Your Google Gemini API key)*
7. Click **Create Web Service**. Your app will be live with an HTTPS URL (e.g., `https://studyflow-ai.onrender.com`).

---

## 🚂 Option 2: Deploy to Railway

1. Install Railway CLI or connect via [railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically detect Node.js and run `Procfile` / `npm start`.
5. Under Variables, add `NODE_ENV=production` and `JWT_SECRET`.
6. Click **Generate Domain** to get your public live link.

---

## 🐳 Option 3: Deploy via Docker

You can build and run the Docker container on any server or cloud VM:

```bash
# Build Docker image
docker build -t studyflow-ai .

# Run container on port 3000
docker run -d -p 3000:3000 --name studyflow studyflow-ai
```

Visit `http://localhost:3000` or your server IP.

---

## 🖥️ Option 4: Deploy on Linux / VPS (Ubuntu / Debian / AWS EC2)

1. **Install Node.js 20 & PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Clone and Install**:
   ```bash
   git clone <your-repo-url> /var/www/studyflow
   cd /var/www/studyflow
   npm install --production
   ```

3. **Start Process with PM2**:
   ```bash
   pm2 start server/server.js --name "studyflow-ai"
   pm2 startup
   pm2 save
   ```

4. **Setup NGINX Reverse Proxy** (Port 80/443 -> Port 3000):
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🔑 Default Administrator & Demo Accounts

| Account Role | Username / Identifier | Password | Access Rights |
|---|---|---|---|
| **Super Administrator (Praveen Kumar)** | `praveen` | Configured securely in system database | Full Admin Portal, Excel Downloads, Live User Question/Answers & Academic Analytics |
| **Demo Student (Alex Mercer)** | `alex.student` | Configured securely in system database | Study Planner, PDF Lab, Focus Shield, Wellness, Fun Mind Check-Up |
