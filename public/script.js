// Connect to the server
const socket = io();

// Get all the elements we need
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const joinButton = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');
const usersListDiv = document.getElementById('users-list');
const onlineCountDiv = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');

let myUsername = '';
let typingTimeout;

// 1. JOIN CHAT FUNCTIONALITY
joinButton.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

function joinChat() {
    myUsername = usernameInput.value.trim();
    
    if (myUsername) {
        // Send our username to server
        socket.emit('join-chat', myUsername);
        
        // Switch screens
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        // Focus on message input
        messageInput.focus();
        
        // Add welcome message
        addSystemMessage(`Welcome to the chat, ${myUsername}!`);
    }
}

// 2. SEND MESSAGE FUNCTIONALITY
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Typing indicator
messageInput.addEventListener('input', () => {
    if (!myUsername) return;
    
    // Tell server we're typing
    socket.emit('typing', myUsername);
    
    // Clear previous timeout
    clearTimeout(typingTimeout);
    
    // Set new timeout to stop typing indicator
    typingTimeout = setTimeout(() => {
        socket.emit('stop-typing');
    }, 1000);
});

function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message && myUsername) {
        // Send to server
        socket.emit('send-message', message);
        
        // Add to our screen immediately (optimistic)
        addMyMessage(message);
        
        // Clear input
        messageInput.value = '';
        
        // Stop typing indicator
        socket.emit('stop-typing');
    }
}

// 3. LISTEN FOR SERVER EVENTS

// When a user joins
socket.on('user-joined', (username) => {
    addSystemMessage(`🎉 ${username} joined the chat`);
});

// When a user leaves
socket.on('user-left', (username) => {
    addSystemMessage(`👋 ${username} left the chat`);
});

// When we receive a message
socket.on('receive-message', (data) => {
    addOtherMessage(data.text, data.user, data.time);
});

// When someone is typing
socket.on('user-typing', (username) => {
    if (username !== myUsername) {
        typingIndicator.textContent = `${username} is typing...`;
    }
});

// When someone stops typing
socket.on('user-stop-typing', () => {
    typingIndicator.textContent = '';
});

// Update online users list
socket.on('update-users', (users) => {
    updateUsersList(users);
});

// 4. HELPER FUNCTIONS

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.textContent = text;
    messagesDiv.appendChild(div);
    scrollToBottom();
}

function addMyMessage(text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const div = document.createElement('div');
    div.className = 'message my-message';
    div.innerHTML = `
        <div class="message-user">You</div>
        <div class="message-text">${text}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesDiv.appendChild(div);
    scrollToBottom();
}

function addOtherMessage(text, username, time) {
    const div = document.createElement('div');
    div.className = 'message other-message';
    div.innerHTML = `
        <div class="message-user">${username}</div>
        <div class="message-text">${text}</div>
        <div class="message-time">${time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    
    messagesDiv.appendChild(div);
    scrollToBottom();
}

function updateUsersList(users) {
    // Update count
    onlineCountDiv.textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;
    
    // Clear and update list
    usersListDiv.innerHTML = '';
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.textContent = user;
        usersListDiv.appendChild(userDiv);
    });
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}