import React, { useState, useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import ChatBox from '../components/ChatBox';
import MessageInput from '../components/MessageInput';
const ChatRoom = () => {
    const socket = useSocket();
    const [room, setRoom] = useState('general');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chatMessages');
        return saved ? JSON.parse(saved) : [];
    });
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [username, setUsername] = useState('');
    const [isTyping, setIsTyping] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Auto-login on mount if credentials exist
    useEffect(() => {
        const savedUsername = localStorage.getItem('chatUsername');
        const savedPassword = localStorage.getItem('chatPassword');
        if (savedUsername && savedPassword) {
            const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
            if (users[savedUsername] && users[savedUsername] === savedPassword) {
                setUsername(savedUsername);
                setPassword(savedPassword);
                setIsAuthenticated(true);
            }
        }
    }, []);

    useEffect(() => {
        if (!socket || !isAuthenticated) return;
        socket.emit('join_room', room);
        socket.on('receive_message', (data) => {
            setMessages((prev) => {
                const updated = [...prev, data.file && data.fileType
                    ? { username: data.username, time: data.timestamp, file: data.file, fileType: data.fileType, message: data.message, id: data.id || Date.now() }
                    : { username: data.username, time: data.timestamp, message: data.message, id: data.id || Date.now() }
                ];
                localStorage.setItem('chatMessages', JSON.stringify(updated));
                return updated;
            });
        });
        socket.on('delete_message', (id) => {
            setMessages((prev) => {
                const updated = prev.filter(msg => msg.id !== id);
                localStorage.setItem('chatMessages', JSON.stringify(updated));
                return updated;
            });
        });
        socket.on('user_typing', (user) => {
            setIsTyping(`${user} is typing...`);
            setTimeout(() => setIsTyping(''), 1000);
        });
        return () => {
            socket.off('receive_message');
            socket.off('delete_message');
            socket.off('user_typing');
        };
    }, [room, socket, isAuthenticated]);

    const sendMessage = () => {
        if (sending) return;
        if (socket) {
            const id = Date.now() + Math.random();
            if (file) {
                setSending(true);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = e.target.result;
                    socket.emit('send_message', {
                        username,
                        message,
                        room,
                        file: base64,
                        fileType: file.type,
                        id
                    });
                    setFile(null);
                    setMessage('');
                    setSending(false);
                };
                reader.onerror = () => {
                    alert('Failed to read file');
                    setSending(false);
                };
                reader.readAsDataURL(file);
            } else if (message.trim()) {
                socket.emit('send_message', { username, message, room, id });
                setMessage('');
            }
        }
    };

    // Delete for me (local only)
    const handleDeleteLocal = (id) => {
        setMessages((prev) => {
            const updated = prev.filter(msg => msg.id !== id);
            localStorage.setItem('chatMessages', JSON.stringify(updated));
            return updated;
        });
    };

    // Delete for everyone
    const handleDeleteGlobal = (id) => {
        if (socket) {
            socket.emit('delete_message', id);
        }
    };

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing', { username, room });
        }
    };

    // Simple localStorage-based auth for demo
    const handleRegister = (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setAuthError('Username and password required');
            return;
        }
        const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
        if (users[username]) {
            setAuthError('Username already exists');
            return;
        }
        users[username] = password;
        localStorage.setItem('chatUsers', JSON.stringify(users));
        localStorage.setItem('chatUsername', username);
        localStorage.setItem('chatPassword', password);
        setIsAuthenticated(true);
        setAuthError('');
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
        if (users[username] && users[username] === password) {
            localStorage.setItem('chatUsername', username);
            localStorage.setItem('chatPassword', password);
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Invalid username or password');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
                <div className="w-full max-w-md p-8 bg-gray-900 bg-opacity-95 rounded-2xl shadow-lg text-white text-center">
                    <h2 className="mb-6 text-2xl font-bold">{authMode === 'login' ? 'Login' : 'Register'}</h2>
                    <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            autoComplete="username"
                            className="w-full mb-3 p-2 rounded-lg border-none text-base bg-gray-800 text-white focus:outline-none"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            className="w-full mb-3 p-2 rounded-lg border-none text-base bg-gray-800 text-white focus:outline-none"
                        />
                        <button type="submit" className="w-full p-2 rounded-lg bg-green-400 text-gray-900 font-bold text-base border-none cursor-pointer mb-2 transition hover:bg-green-500">
                            {authMode === 'login' ? 'Login' : 'Register'}
                        </button>
                    </form>
                    {authError && <p className="text-red-400 mt-2">{authError}</p>}
                    <p className="mt-4">
                        {authMode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <button className="bg-none text-green-400 border-none cursor-pointer font-bold" onClick={() => { setAuthMode('register'); setAuthError(''); }}>Register</button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button className="bg-none text-green-400 border-none cursor-pointer font-bold" onClick={() => { setAuthMode('login'); setAuthError(''); }}>Login</button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('chatUsername');
        localStorage.removeItem('chatPassword');
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
    };

    return (
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto my-8 rounded-2xl shadow-md bg-gray-100 flex flex-col h-[80vh]">
            <div className="bg-teal-700 text-white py-4 px-6 font-bold text-lg text-center border-b border-gray-300 flex items-center justify-between">
                <span>Chat Room: {room}</span>
                <button onClick={handleLogout} className="bg-red-400 hover:bg-red-500 text-white rounded-lg px-4 py-1 font-bold text-base ml-2 transition">Logout</button>
            </div>
            <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">No messages yet.</p>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.username === username;
                        return (
                            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 relative`}>
                                <div className={`rounded-xl px-4 py-2 max-w-[70%] shadow-sm text-base break-words relative ${isMe ? 'bg-green-100' : 'bg-white'} text-gray-900`}>
                                    <div className="font-bold text-sm mb-1">{msg.username}{msg.time ? ` [${msg.time}]` : ''}</div>
                                    {msg.file && msg.fileType && msg.fileType.startsWith('image') && (
                                        <img src={msg.file} alt="uploaded" className="max-w-full rounded-lg my-2" />
                                    )}
                                    {msg.file && msg.fileType && msg.fileType.startsWith('audio') && (
                                        <audio controls src={msg.file} className="w-full my-2" />
                                    )}
                                    {msg.file && msg.fileType && msg.fileType.startsWith('video') && (
                                        <video controls src={msg.file} className="w-full my-2" />
                                    )}
                                    {msg.message && <div>{msg.message}</div>}
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleDeleteLocal(msg.id)} className="text-xs bg-gray-200 rounded px-2 py-1 cursor-pointer">Delete for me</button>
                                        <button onClick={() => handleDeleteGlobal(msg.id)} className="text-xs bg-red-400 text-white rounded px-2 py-1 cursor-pointer">Delete for everyone</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <p className="text-gray-500 italic mt-2">{isTyping}</p>
            </div>
            <div className="p-4 bg-gray-200 border-t border-gray-300">
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex flex-col gap-2">
                    <MessageInput
                        message={message}
                        setMessage={setMessage}
                        sendMessage={sendMessage}
                        onTyping={handleTyping}
                        username={username}
                    />
                    <input
                        type="file"
                        accept="image/*,audio/*,video/*"
                        onChange={e => setFile(e.target.files[0])}
                        className="mb-2"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className={`p-2 rounded-lg font-bold text-base border-none transition ${sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-400 hover:bg-green-500 text-gray-900 cursor-pointer'}`}
                        disabled={sending || (!(message.trim() || file))}
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ChatRoom;
