// socket/index.js
module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('send_message', (data) => {
            const timestamp = new Date().toLocaleTimeString();
            // Only allow certain file types and reasonable size (base64 length check)
            let safeData = {
                username: data.username,
                message: data.message,
                room: data.room,
                timestamp,
                id: data.id || Date.now()
            };
            if (data.file && data.fileType) {
                // Accept images, audio, video only
                if (/^(image|audio|video)\//.test(data.fileType) && data.file.length < 2e6) { // ~2MB
                    safeData.file = data.file;
                    safeData.fileType = data.fileType;
                }
            }
            io.to(data.room).emit('receive_message', safeData);
        });

        socket.on('delete_message', (id) => {
            // Broadcast to all clients in the room to delete the message
            // Find the rooms this socket is in (except its own id room)
            const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
            rooms.forEach(room => {
                io.to(room).emit('delete_message', id);
            });
        });

        socket.on('typing', ({ room, username }) => {
            socket.to(room).emit('user_typing', username);
        });

        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`User joined room: ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
