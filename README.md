# Insight System

Insight is a comprehensive college management and communication dashboard designed to streamline operations between Colleges and the Deputy Director of Public Instruction (DDPO). It facilitates real-time communication, document management, infrastructure tracking, and daily attendance monitoring.

## 🚀 Features

### For DDPO (Deputy Director)
- **Dashboard Overview:** View real-time statistics of colleges, attendance summary, and recent activities.
- **College Management:** View detailed profiles of all colleges, including their infrastructure and uploaded documents.
- **Attendance Monitoring:** Track daily login attendance of all colleges with strict time windows (9 AM - 9 PM IST). Export attendance reports as CSV.
- **Circulars:** Send official circulars (PDF, Word, Images) to specific categories of colleges (e.g., Aided, Government) or all colleges.
- **Queries:** Send file-based or link-based (Google Sheet) queries to colleges and receive responses.
- **Infrastructure:** View infrastructure photos uploaded by colleges.

### For Colleges (Admin)
- **Daily Attendance:** Mark daily attendance within the mandatory 9 AM - 9 PM window.
- **Circulars:** View and download circulars sent by the DDPO.
- **Query Response:** Respond to queries from the DDPO by uploading requested files or updating Google Sheets.
- **Document Management:** Upload and manage college documents (PDFs) with a mandatory responsibility disclaimer.
- **Infrastructure Gallery:** Upload and manage photos of college infrastructure (Classrooms, Labs, etc.) with proper labeling and dimensions.
- **Real-time Notifications:** Receive instant alerts for new circulars and queries.

## 🛠️ Technology Stack

- **Frontend:**
  - React (Vite)
  - TypeScript
  - Tailwind CSS
  - Shadcn UI (Component Library)
  - Lucide React (Icons)
  - Socket.IO Client (Real-time updates)

- **Backend:**
  - Node.js & Express
  - MongoDB (Database)
  - Socket.IO (Real-time communication)
  - Multer (File uploads)
  - JSON Web Tokens (JWT) for Authentication

## 📂 Project Structure

```
Insight/
├── src/                # Frontend source code
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Contexts (Auth, Notification)
│   ├── pages/          # Application pages (Dashboard, Attendance, etc.)
│   └── lib/            # Utilities
├── backend/            # Backend server code
│   ├── models/         # MongoDB Mongoose models
│   ├── routes/         # API routes
│   └── server.js       # Entry point
└── public/             # Static assets
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/Vishnups08/Insight.git
cd Insight
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
Navigate back to the root directory (or remain in root if strictly mono-repo style) and install dependencies:
```bash
cd ..
npm install
```

Start the development server:
```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## 📄 License
This project is proprietary and intended for internal use [MIT License](LICENSE).
