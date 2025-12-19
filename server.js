const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let onlineUsers = {};

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('join-chat', (username) => {
        onlineUsers[socket.id] = username;
        socket.broadcast.emit('user-joined', username);
        io.emit('update-users', Object.values(onlineUsers));
    });

    socket.on('send-message', (message) => {
        const username = onlineUsers[socket.id];
        if (username) {
            socket.broadcast.emit('receive-message', {
                user: username,
                text: message,
                time: new Date().toLocaleTimeString()
            });
        }
    });

    socket.on('send-image', (imageData) => {
        const username = onlineUsers[socket.id];
        if (username) {
            console.log(`${username} sent an image`);
            
            const imageResponse = {
                user: username,
                imageUrl: imageData.imageUrl,
                imageId: imageData.imageId || Date.now(),
                caption: imageData.caption || '',
                time: new Date().toLocaleTimeString()
            };
            
            socket.broadcast.emit('receive-image', imageResponse);
            
            socket.emit('image-sent-confirm', {
                ...imageResponse,
                status: 'sent'
            });
        }
    });

    socket.on('send-audio', (audioData) => {
        const username = onlineUsers[socket.id];
        if (username) {
            console.log(`${username} sent audio`);
            
            const audioResponse = {
                user: username,
                audioUrl: audioData.audioUrl,
                audioId: audioData.audioId || Date.now(),
                duration: audioData.duration || 0,
                time: new Date().toLocaleTimeString()
            };
            
            socket.broadcast.emit('receive-audio', audioResponse);
            
            socket.emit('audio-sent-confirm', {
                ...audioResponse,
                status: 'sent'
            });
        }
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});