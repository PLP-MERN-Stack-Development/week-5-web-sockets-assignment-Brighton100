import React from 'react';
import { SocketProvider } from './context/SocketContext';
import ChatRoom from './pages/ChatRoom';

function App() {
  return (
    <SocketProvider>
      <ChatRoom />
    </SocketProvider>
  );
}

export default App;
