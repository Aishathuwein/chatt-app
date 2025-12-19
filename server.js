// ========== 1. TOP OF FILE ==========
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');  // ⭐ ADD THIS LINE

// Create app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ========== 2. MIDDLE SECTION ==========
// ⭐ ADD THESE TWO LINES HERE:
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store online users
let onlineUsers = {};

// ========== 3. SOCKET.IO CODE ==========
// (Your existing socket.io code stays here - don't change it)
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('join-chat', (username) => {
        onlineUsers[socket.id] = username;
        socket.broadcast.emit('user-joined', username);
        io.emit('update-users', Object.values(onlineUsers));
    });

    socket.on('send-message', (message) => {
        const username = onlineUsers[socket.id];
        socket.broadcast.emit('receive-message', {
            user: username,
            text: message,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('user-typing', username);
    });

    socket.on('stop-typing', () => {
        socket.broadcast.emit('user-stop-typing');
    });

    socket.on('disconnect', () => {
        const username = onlineUsers[socket.id];
        if (username) {
            delete onlineUsers[socket.id];
            io.emit('user-left', username);
            io.emit('update-users', Object.values(onlineUsers));
        }
    });
});

// ========== 4. BOTTOM OF FILE ==========
// ⭐ CHANGE THESE LINES AT THE BOTTOM:
const PORT = process.env.PORT || 3000;  // ⭐ USE THIS LINE

server.listen(PORT, '0.0.0.0', () => {  // ⭐ ADD '0.0.0.0'
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Ready for global access!`);
});