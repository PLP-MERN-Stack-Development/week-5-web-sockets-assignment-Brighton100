// socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5050'); // adjust if deployed

export default socket;
