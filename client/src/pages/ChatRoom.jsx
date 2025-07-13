import React, { useState, useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import ChatBox from '../components/ChatBox';
import MessageInput from '../components/MessageInput';
const ChatRoom = () => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showReset, setShowReset] = useState(false);
    const [resetUsername, setResetUsername] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetError, setResetError] = useState('');

    const handleResetPassword = (e) => {
        e.preventDefault();
        if (!resetUsername.trim() || !resetPassword.trim()) {
            setResetError('Username and new password required');
            return;
        }
        const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
        const entered = resetUsername.trim().toLowerCase();
        // Find matching username (case-insensitive)
        const match = Object.keys(users).find(u => u.trim().toLowerCase() === entered);
        if (!match) {
            setResetError('Username does not exist');
            return;
        }
        users[match] = resetPassword;
        localStorage.setItem('chatUsers', JSON.stringify(users));
        setResetError('Password reset successful!');
        setTimeout(() => {
            setShowReset(false);
            setResetUsername('');
            setResetPassword('');
            setResetError('');
        }, 1500);
    };
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
        socket.emit('set_username', username);
        socket.on('online_users', (users) => {
            setOnlineUsers(users);
        });
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
            socket.off('online_users');
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
                background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 100%)' // golden gradient
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700', marginBottom: 12, letterSpacing: 2 }}>Brighton Mark</h1>
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
                    <button
                        style={{ width: '100%', padding: 8, borderRadius: 8, background: '#FFD700', color: '#222', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer', marginBottom: 8, marginTop: 4 }}
                        onClick={() => { setShowReset(true); setResetError(''); }}
                    >
                        Forgot Password?
                    </button>
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
                    {showReset && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ maxWidth: 350, width: '100%', background: '#fff', color: '#222', borderRadius: 12, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                                <h3 style={{ marginBottom: 16, fontWeight: 'bold', fontSize: '1.2rem' }}>Reset Password</h3>
                                <form onSubmit={handleResetPassword}>
                                    <input
                                        value={resetUsername}
                                        onChange={e => setResetUsername(e.target.value)}
                                        placeholder="Username"
                                        style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }}
                                    />
                                    <input
                                        type="password"
                                        value={resetPassword}
                                        onChange={e => setResetPassword(e.target.value)}
                                        placeholder="New Password"
                                        style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }}
                                    />
                                    <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#FFD700', color: '#222', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer', marginBottom: 8 }}>Reset</button>
                                </form>
                                {resetError && <p style={{ color: resetError.includes('successful') ? '#25d366' : '#ff6b6b', marginTop: 8 }}>{resetError}</p>}
                                <button style={{ marginTop: 12, background: 'none', color: '#075e54', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowReset(false)}>Close</button>
                            </div>
                        </div>
                    )}
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
        <div
            className="fixed inset-0 flex items-center justify-center bg-[#ece5dd]"
            style={{background: '#ece5dd', zIndex: 1}}
        >
            <div
                className="w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-2xl shadow-md flex flex-col h-[80vh]"
                style={{background: '#ece5dd'}}
            >
                <div className="py-4 px-6 font-bold text-lg text-center border-b flex items-center justify-between" style={{background: '#075e54', color: 'white', borderBottom: '1px solid #ddd'}}>
                    <span>Chat Room: {room}</span>
                    <button onClick={handleLogout} className="rounded-lg px-4 py-1 font-bold text-base ml-2 transition" style={{background: '#ff6b6b', color: 'white'}}>Logout</button>
                </div>
                <div style={{background: '#fafafa', borderBottom: '1px solid #ddd', padding: '0.5rem 1rem', fontSize: '0.95rem', color: '#075e54', fontWeight: 'bold'}}>
                    Online: {onlineUsers.length > 0 ? onlineUsers.join(', ') : 'No users online'}
                </div>
                <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto" style={{background: '#fafafa'}}>
                {messages.length === 0 ? (
                    <p className="text-center" style={{color: '#888'}}>No messages yet.</p>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.username === username;
                        return (
                            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 relative`}>
                                <div className="rounded-xl px-4 py-2 max-w-[70%] shadow-sm text-base break-words relative" style={{background: isMe ? '#dcf8c6' : '#fff', color: '#222', fontSize: '1rem', wordBreak: 'break-word', position: 'relative'}}>
                                    <div className="font-bold text-sm mb-1" style={{fontWeight: 'bold', fontSize: '0.95rem', marginBottom: 2}}>{msg.username}{msg.time ? ` [${msg.time}]` : ''}</div>
                                    {msg.file && msg.fileType && msg.fileType.startsWith('image') && (
                                        <img src={msg.file} alt="uploaded" className="max-w-full rounded-lg my-2" style={{borderRadius: 8, margin: '6px 0'}} />
                                    )}
                                    {msg.file && msg.fileType && msg.fileType.startsWith('audio') && (
                                        <audio controls src={msg.file} className="w-full my-2" style={{width: '100%', margin: '6px 0'}} />
                                    )}
                                    {msg.file && msg.fileType && msg.fileType.startsWith('video') && (
                                        <video controls src={msg.file} className="w-full my-2" style={{width: '100%', margin: '6px 0'}} />
                                    )}
                                    {msg.message && <div>{msg.message}</div>}
                                    <div className="flex gap-2 mt-2" style={{display: 'flex', gap: 4, marginTop: 6}}>
                                        <button onClick={() => handleDeleteLocal(msg.id)} className="text-xs rounded px-2 py-1 cursor-pointer" style={{fontSize: '0.85rem', background: '#eee', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer'}}>Delete for me</button>
                                        <button onClick={() => handleDeleteGlobal(msg.id)} className="text-xs text-white rounded px-2 py-1 cursor-pointer" style={{fontSize: '0.85rem', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer'}}>Delete for everyone</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <p className="italic mt-2" style={{color: '#888', fontStyle: 'italic', margin: '8px 0 0 0'}}>{isTyping}</p>
            </div>
                <div className="p-4 border-t" style={{background: '#f0f0f0', borderTop: '1px solid #ddd'}}>
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
                        className="p-2 rounded-lg font-bold text-base border-none transition"
                        style={{background: sending ? '#ccc' : '#25d366', color: '#222', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: sending ? 'not-allowed' : 'pointer'}}
                        disabled={sending || (!(message.trim() || file))}
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
            </div>
        </div>
    );
};
export default ChatRoom;
