// client/src/socket/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:  5050'); // 👈 connect to backend

export default socket;
