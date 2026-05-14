# Smart School Van Tracking & Communication System

A comprehensive full-stack mobile application designed to ensure the safety and efficient transportation of school children. The system connects Parents, School Van Drivers, and Administrators through real-time tracking and seamless communication.

## 🌟 Key Features

### 👨‍👩‍👧‍👦 For Parents

- **Secure Authentication:** Easy registration and login with OTP verification.
- **Child Management:** Add and manage details of multiple children.
- **Find Drivers:** Search and connect with available school van drivers in the area.
- **Real-time Tracking:** Live GPS tracking of the school van using an interactive map.
- **Attendance & Reports:** Track child's daily attendance and generate reports.
- **Online Payments:** Integrated secure payment gateway for monthly van fees.

### 🚐 For Drivers

- **Open Registration:** Any user can register as a driver independently to offer transportation services.
- **Route & Navigation:** View student pickup/drop-off locations on the map.
- **Student Management:** Manage the list of students assigned to the van.
- **Financial Dashboard:** Track monthly income, view payment statuses, and manage financial reports.

### 🛡️ For Administrators

- **Centralized Dashboard:** Oversee system operations.
- **User Management:** Monitor and manage registered Drivers, Parents, and Students.
- **System Security:** Ensure standard compliance and resolve user issues.

## 🛠️ Tech Stack

**Frontend (Mobile App)**

- React Native / Expo
- Tailwind CSS (NativeWind)
- React Navigation
- Google Maps Integration (Real-time tracking)
- Socket.io-client (Real-time communication)

**Backend (Server)**

- Node.js & Express.js
- MongoDB & Mongoose (Database)
- JSON Web Tokens (JWT) for Authentication
- Socket.io (WebSocket for live location sharing)
- Nodemailer (Email/OTP services)

## 📂 Project Structure

```text
smart-school-van-tracking-system/
├── backend/                  # Node.js Express Server
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # API logic (User, Child, Payment)
│   ├── middleware/           # JWT Auth middlewares
│   ├── models/               # MongoDB Schemas
│   ├── routes/               # Express API routes
│   └── utils/                # Helper functions (e.g., SendEmail)
│
└── frontend/                 # React Native Mobile App
    ├── assets/               # Images and icons
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── screens/          # App screens (Admin, Auth, Driver, Parent)
    │   └── services/         # API calls and Socket.io setup
    ├── App.js                # App entry point
    └── tailwind.config.js    # Tailwind styling configurations


🚀 Installation & Setup
Prerequisites
Node.js installed

MongoDB instance running

Expo CLI installed globally

1. Backend Setup
Navigate to the backend directory:

Bash
cd backend
Install dependencies:

Bash
npm install
Create a .env file in the backend directory and configure the following variables:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
Start the server:

Bash
npm start
# or for development:
npm run dev
2. Frontend Setup
Navigate to the frontend directory:

Bash
cd frontend
Install dependencies:

Bash
npm install
Configure environment variables (if any) and update the src/services/api.js to point to your local or hosted backend server URL.

Start the Expo development server:

Bash
npx expo start
Use the Expo Go app on your physical device or an emulator to run the application.

🧑‍💻 Author
Developed by Lakindu Chamodya
```
