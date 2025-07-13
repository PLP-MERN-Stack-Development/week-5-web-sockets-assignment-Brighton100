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
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
            }}>
                <div style={{
                    maxWidth: 400,
                    width: '100%',
                    padding: '2rem',
                    background: 'rgba(32,44,65,0.95)',
                    borderRadius: 16,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    color: '#fff',
                    textAlign: 'center',
                }}>
                    <h2 style={{ marginBottom: 24 }}>{authMode === 'login' ? 'Login' : 'Register'}</h2>
                    <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            autoComplete="username"
                            style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: 'none', fontSize: '1rem' }}
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: 'none', fontSize: '1rem' }}
                        />
                        <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#25d366', color: '#222', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer', marginBottom: 8 }}>
                            {authMode === 'login' ? 'Login' : 'Register'}
                        </button>
                    </form>
                    {authError && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{authError}</p>}
                    <p style={{ marginTop: 16 }}>
                        {authMode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <button style={{ background: 'none', color: '#25d366', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Register</button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button style={{ background: 'none', color: '#25d366', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Login</button>
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
        <div style={{
            maxWidth: 500,
            margin: '2rem auto',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            background: '#ece5dd',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '80vh'
        }}>
            <div style={{
                background: '#075e54',
                color: 'white',
                padding: '1rem',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                textAlign: 'center',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span>Chat Room: {room}</span>
                <button onClick={handleLogout} style={{
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginLeft: 8
                }}>Logout</button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto', background: '#fafafa' }}>
                {messages.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center' }}>No messages yet.</p>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.username === username;
                        return (
                            <div key={msg.id || i} style={{
                                display: 'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                marginBottom: 8,
                                position: 'relative'
                            }}>
                                <div style={{
                                    background: isMe ? '#dcf8c6' : '#fff',
                                    color: '#222',
                                    borderRadius: 12,
                                    padding: '8px 14px',
                                    maxWidth: '70%',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    fontSize: '1rem',
                                    wordBreak: 'break-word',
                                    position: 'relative'
                                }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: 2 }}>{msg.username}{msg.time ? ` [${msg.time}]` : ''}</div>
                                    {msg.file && msg.fileType && msg.fileType.startsWith('image') && (
                                        <img src={msg.file} alt="uploaded" style={{ maxWidth: '100%', borderRadius: 8, margin: '6px 0' }} />
                                    )}
                                    {msg.file && msg.fileType && msg.fileType.startsWith('audio') && (
                                        <audio controls src={msg.file} style={{ width: '100%', margin: '6px 0' }} />
                                    )}
                                    {msg.file && msg.fileType && msg.fileType.startsWith('video') && (
                                        <video controls src={msg.file} style={{ width: '100%', margin: '6px 0' }} />
                                    )}
                                    {msg.message && <div>{msg.message}</div>}
                                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                        <button onClick={() => handleDeleteLocal(msg.id)} style={{ fontSize: '0.85rem', background: '#eee', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>Delete for me</button>
                                        <button onClick={() => handleDeleteGlobal(msg.id)} style={{ fontSize: '0.85rem', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>Delete for everyone</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <p style={{ color: '#888', fontStyle: 'italic', margin: '8px 0 0 0' }}>{isTyping}</p>
            </div>
            <div style={{ padding: '1rem', background: '#f0f0f0', borderTop: '1px solid #ddd' }}>
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                        style={{ marginBottom: 8 }}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: 10,
                            borderRadius: 8,
                            background: sending ? '#ccc' : '#25d366',
                            color: '#222',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: sending ? 'not-allowed' : 'pointer'
                        }}
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
