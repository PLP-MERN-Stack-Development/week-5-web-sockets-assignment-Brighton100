```
# 💬 Real-Time Chat App – Week 5 Project

A minimal real-time chat application built with **React**, **Express**, and **Socket.IO** for seamless communication between users. This project demonstrates WebSocket communication, user message handling, and live updates using modern frontend and backend technologies.

---

## 🚀 Features

- 🔌 Real-time communication using Socket.IO
- 💬 Chat interface with user name, message, and timestamp
- 📱 Responsive and clean UI using TailwindCSS
- 🎯 Automatically prompts for user name on join
- 🔁 Live updates as users send messages
- ⌛ Displays message time in `HH:MM` format

---

## 🛠 Tech Stack

### Frontend
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Socket.IO Client](https://socket.io/)

### Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)

---

## 📸 Screenshot

![Chat App Preview](./assets/chat-preview.png)

---

## 📦 Installation & Running Locally

### Prerequisites:
- Node.js ≥ v18+
- `pnpm` package manager (or use `npm`)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Brighton100/week-5-web-sockets-assignment-Brighton100.git
cd week-5-web-sockets-assignment-Brighton100

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Start the Backend Server

```bash
pnpm run server
# or
npm run server
```

### 4. Start the Frontend Development Server

```bash
pnpm run dev
# or
npm run dev
```

The backend server will typically run on `http://localhost:3000` and the frontend on `http://localhost:5173` (default Vite port).

---

## 📝 Usage

1. Open the frontend URL in your browser.
2. Enter your username when prompted.
3. Start chatting in real time with other connected users!

---

## 📂 Project Structure

```
├socketio-chat/
├── client/                 # React front-end
│   ├── public/wk 5.png             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── socket/         # Socket.io client setup
│   │   └── App.jsx         # Main application component
│   └── package.json        # Client dependencies
├── server/                 # Node.js back-end
│   ├── config/             # Configuration files
│   ├── controllers/        # Socket event handlers
│   ├── models/             # Data models
│   ├── socket/             # Socket.io server setup
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json        # Server dependencies
└── README.md               # Project documentation

```
## Deployed link for both client and sever: 
https://week-5-web-sockets-assignment-brigh.vercel.app/

---

## 🙌 Credits

Built by [Brighton100](https://github.com/Brighton100) for the Week 5 Web Sockets Assignment.

---

## 📃 License

This project is licensed under the [MIT License](LICENSE).
```
