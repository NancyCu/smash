# 🏈 Squares Royale

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

<div align="center">
  <img src="./public/SouperBowlDark.png" alt="Squares Royale Logo" width="200" height="200" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);" />
  
  <h2 className="text-3xl font-bold">The Ultimate Sports Grid Platform</h2>
  <p>Host your game pools with a beautiful, responsive interface that works perfectly on mobile and desktop.</p>
</div>

---

## 🎨 User Guide

Welcome to **Squares Royale**! Whether you're hosting a game or joining one, getting started is easy.

### 1️⃣ How to Sign Up & Sign In

Our secure login system keeps your game history safe.

#### **📝 Sign Up & Login**
Toggle easily between Sign In and Sign Up to get started.

1. Click **"Log In"** to open the secure portal.
2. Toggle between **"Sign In"** and **"Sign Up"**.
3. Enter your details to jump into the action!

<div align="center">
  <img src="./public/screenshots/auth-flow.png" alt="Authentication Screen" width="300" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin: 20px 0;" />
</div>

> 💡 **Tip:** You can see all your games in your **Profile** dashboard after logging in!

---

### 🔗 Joining a Game

Received a code? Enter the arena instantly!

1. **Enter Game Code**: Type in the unique code shared by your host (e.g., `IX8Z4080`).
2. **Auto-Fill**: If you clicked a link, this is filled for you!

<div align="center">
  <img src="./public/screenshots/join-game.png" alt="Join Game Screen" width="300" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin: 20px 0;" />
</div>

---

### 📱 Mobile-First Grid Experience

Our grid is optimized for every device.

<div align="center">
  <img src="./public/screenshots/grid-view.png" alt="Mobile Grid View" width="300" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin: 20px 0;" />
</div>

---

### 🚀 Easy Sharing

Invite friends via text or social media with one click. The preview card looks great!

<div align="center">
  <img src="./public/screenshots/share-preview.png" alt="Sharing Preview" width="300" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin: 20px 0;" />
</div>

---

## ✨ Key Features

### 🎮 **Live Game Grid**
- **10x10 Interactive Grid**: Click any open square to claim it.
- **Micro-Symmetrical Layout**: Even with 5+ players on one square, our smart layout keeps it readable!
- **Desktop & Mobile Optimized**: Looks great on your phone or your ultra-wide monitor.

### 🏆 **Real-Time Scoring**
- **Live Updates**: Scores update automatically. No refreshing needed!
- **Winner Highlighting**: See who is winning the current quarter instantly.
- **Payout Ledger**: Track exactly who won what and when.

### 👤 **Player Profiles**
- **Game History**: See every game you've ever played or hosted.
- **One-Click Rejoin**: Jump back into active games from your dashboard.
- **Stats**: Track your wins and total games played.

---

## 🛠️ Developer Setup

If you want to run this code yourself, here is how to get started.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NancyCu/squares.git
   cd squares
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

### Configuration

This app uses **Firebase** for backend services.
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password).
3. Create a **Firestore Database**.
4. Create a `.env.local` file with your credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```

---

<p align="center">
  Built with ❤️ by <strong>NancyCu</strong>
</p>
