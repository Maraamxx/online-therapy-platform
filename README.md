# InnerAura – Online Therapy Platform

**InnerAura** is a full-stack mental health platform built to make therapy more accessible and scalable across the MENA region. It empowers clients to match with therapists, book sessions, and attend secure online therapy — all in one place.

---

## ✨ Features

- Smart therapist-client matching based on assessment results  
- Manual therapist browsing with filters  
- Real-time session booking from available therapist time slots  
- Tiered subscription plans and one-time payments  
- Secure audio/video therapy sessions (via Jitsi API)  
- Session management (rescheduling, cancellations with refund logic)  
- Therapist dashboard to manage availability and appointments  
- Admin dashboard for therapist verification and platform control  

---

## 🛠 Tech Stack

**Backend:**
- Node.js, Express.js
- PostgreSQL
- JWT-based authentication
- Bcrypt for password hashing
- Nodemailer for email verification and password reset

**Frontend:**
- HTML, CSS, JavaScript (Vanilla), Tailwind, Bootstrap
- Role-based dynamic UI for clients and therapists
- Responsive design

---

## 🧱 Architecture

- RESTful API structure  
- Layered architecture:
routes → controllers → services → models → queries


---

## 🚀 Getting Started

1. **Clone the repository**
 ```bash
 git clone https://github.com/Maraamxx/online-therapy-platform.git
 cd online-therapy-platform
```

2. **Backend setup**
```bash
cd backend
npm install
```

3. **Configure environment variables**
Create a .env file in the backend folder:
```
🗄️ Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

🔐 JWT Authentication
JWT_SECRET=
REFRESH_SECRET=
JWT_EXPIRES_IN=15m

📧 Email (for verification/reset)
EMAIL_HOST=smtp.gmail.com # e.g. smtp.gmail.com or smtp.mailtrap.io
EMAIL_PORT=587 # Use 465 if EMAIL_SECURE=true
EMAIL_SECURE=false # true for port 465 (SSL), false for 587 (TLS)
EMAIL_USER= # Your email
EMAIL_PASS= # Your email password or app password
EMAIL_FROM= # e.g. InnerAura your@email.com

🎥 Jitsi API (for video sessions)
JITSI_PRIVATE_KEY=
JITSI_KEY_ID=
JITSI_APP_ID=

🔒 Internal app-level secret
INTERNAL_API_SECRET=

🌐 App URL (used for links in emails, etc.)
APP_URL=http://localhost:3000

🛠️ Port (optional)
PORT=3000
```
4. **Run the backend**
```bash
npm start
```
