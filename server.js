const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Create app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving index.html (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store online users
let onlineUsers = {};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // User joins
    socket.on('join-chat', (username) => {
        onlineUsers[socket.id] = username;
        socket.broadcast.emit('user-joined', username);
        io.emit('update-users', Object.values(onlineUsers));
    });

    // User sends message
    socket.on('send-message', (message) => {
        // Handle image messages
socket.on('send-image', (imageData) => {
    const username = onlineUsers[socket.id];
    if (username) {
        // Broadcast image to everyone except sender
        socket.broadcast.emit('receive-image', {
            user: username,
            imageData: imageData.imageData,
            filename: imageData.filename,
            size: imageData.size,
            time: new Date().toLocaleTimeString()
        });
        console.log(`${username} sent an image: ${imageData.filename}`);
    }
});const username = onlineUsers[socket.id];
        socket.broadcast.emit('receive-message', {
            user: username,
            text: message,
            time: new Date().toLocaleTimeString()
        });
    });

    // Typing indicators
    socket.on('typing', (username) => {
        socket.broadcast.emit('user-typing', username);
    });

    socket.on('stop-typing', () => {
        socket.broadcast.emit('user-stop-typing');
    });

    // User disconnects
    socket.on('disconnect', () => {
        const username = onlineUsers[socket.id];
        if (username) {
            delete onlineUsers[socket.id];
            io.emit('user-left', username);
            io.emit('update-users', Object.values(onlineUsers));
        }
    });
});

// Set port for Render
const PORT = process.env.PORT || 3000;

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Ready for connections!`);
});