import { useEffect, useRef, useState } from 'react';
import socket from './socket/socket';

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Get stored username or prompt once
    useEffect(() => {
        let name = localStorage.getItem('chat-username');
        if (!name) {
            name = prompt('Enter your name');
            if (name) {
                localStorage.setItem('chat-username', name);
            }
        }
        setUsername(name);
        socket.emit('join', name);

        const handleMessage = (payload) => {
            setMessages((prev) => [...prev, payload]);
        };

        socket.on('chatMessage', handleMessage);

        return () => {
            socket.off('chatMessage', handleMessage);
        };
    }, []);

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const sendMessage = () => {
        if (input.trim()) {
            const messageData = {
                username,
                message: input,
                time: getCurrentTime(),
            };
            setMessages((prev) => [...prev, messageData]);
            socket.emit('chatMessage', messageData);
            setInput('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-4">💬 Real-Time Chat by Brighton</h1>
                <div className="h-64 overflow-y-auto border rounded p-3 bg-gray-50 mb-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="mb-3">
                            <div className="text-sm text-gray-500 flex justify-between">
                                <span className="font-semibold text-blue-600">{msg.username}</span>
                                <span>{msg.time}</span>
                            </div>
                            <div className="text-gray-800">{msg.message}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2">
                    <input
                        className="flex-grow px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
