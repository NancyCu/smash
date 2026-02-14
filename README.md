# 🏈 SmashedBox - The Ultimate Betting Suite

> **"Because with us, a Nguyen is always a Win"**

![App Banner](public/SouperBowlDark.png)

## 📖 Introduction

**SmashedBox** is a modern, real-time web application that transforms traditional party games into sleek, digital experiences. Initially built to revolutionize the Super Bowl Squares pool, it has evolved into a multi-game platform featuring:

*   **Super Bowl Squares**: Automated grid generation with live ESPN score integration.
*   **Bau Cua**: A real-time, interactive digital version of the classic Vietnamese dice game.
*   **Lipid Lotto**: A fun, quick-fire lottery game.

Built with **Next.js 15**, **Firebase**, and **Tailwind CSS**, SmashedBox offers a premium, dark-themed interface mobile-responsiveness, and secure real-time gameplay.

---

## 🎮 Game Modes

### 1. 🏈 Super Bowl Squares (The Classic)
Say goodbye to paper grids.
*   **Automated Shuffle**: Uses the Fisher-Yates algorithm to generate fair, random numbers for every quarter (Q1, Q2, Q3, Final).
*   **Live Scoring**: Integrated with ESPN API to automatically track scores and highlight winning squares in real-time.
*   **User Management**: Players can pick their own squares, or you can assign them.

### 2. 🦀 Bau Cua (Live Dice Game)
A digital reimagining of *Bầu Cua Tôm Cá*.
*   **Host Mode**: One device acts as the "Host" table. The host controls the dice roll and inputs the result.
*   **Client Mode**: Players join on their own phones to place bets on the 6 animals.
*   **Real-Time Sync**: When the Host rolls, all player screens update to "Rolling...". When the Host submits results, payouts are calculated instantly.
*   **Ledger System**: Tracks all wins, losses, and transfers for a complete game history.

### 3. ❤️ Lipid Lotto
*   **Quick Play**: A simple lottery-style game for quick fun.

---

## ✨ Key Features

*   **⚡ Real-Time Updates**: Powered by Firestore, game states sync across all devices instantly.
*   **🔐 Secure Authentication**: Robust email/password login via Firebase Auth.
*   **📱 Mobile-First Design**: Optimized for any device size with smooth Framer Motion animations.
*   **🎲 Fair Play**: verifiable randomization algorithms ensuring game integrity.
*   **💰 Digital Wallet**: Built-in banking system to track virtual currency across all games.
*   **📊 Stats & History**: Personalized profiles tracking your wins, losses, and game participation.

---

## 🚀 Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Tailwind Merge](https://github.com/dcastil/tailwind-merge)
*   **Backend / Auth:** [Firebase](https://firebase.google.com/) (Firestore, Auth)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)

---

## 📸 Gallery

| **Join Screen** | **Squares Grid** |
|:---:|:---:|
| ![Join Game](public/screenshots/join-game.png) | ![Grid View](public/screenshots/grid-view.png) |
| *Enter a game code to join instantly.* | *Live tracking of rows and columns.* |

| **Bau Cua Board** | **Mobile Profile** |
|:---:|:---:|
| ![Bau Cua](public/screenshots/bau-cua.png) | ![Profile](public/screenshots/profile.png) |
| *Interactive betting board.* | *Track your stats and history.* |

*(Note: Add screenshot files to `public/screenshots` folder)*

---

## 🛠️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

*   Node.js (v18+ recommended)
*   npm or yarn
*   A Firebase project with **Authentication** and **Firestore** enabled.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NancyCu/smash.git
    cd smashedbox
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📜 License

This project is proprietary and intended for personal use.

**Created by Michael Nguyen & Nancy Cu**
