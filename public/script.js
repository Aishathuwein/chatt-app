// ========== INITIALIZATION ==========
const socket = io();
let myUsername = '';
let onlineUsers = [];
let typingTimeout;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const onlineCount = document.getElementById('online-count');
const sidebarOnlineCount = document.getElementById('sidebar-online-count');
const typingIndicator = document.getElementById('typing-indicator');
const typingUser = document.getElementById('typing-user');
const usersList = document.getElementById('users-list');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');
const backBtn = document.getElementById('back-btn');
const chatTitleText = document.getElementById('chat-title-text');

// ========== MOBILE UI FUNCTIONS ==========
function toggleSidebar() {
    sidebar.classList.toggle('sidebar-open');
    sidebarOverlay.classList.toggle('showing');
}

function closeSidebarMenu() {
    sidebar.classList.remove('sidebar-open');
    sidebarOverlay.classList.remove('showing');
}

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Show typing indicator
    if (myUsername && this.value.trim().length > 0) {
        socket.emit('typing', myUsername);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing');
        }, 1000);
    }
});

// ========== EVENT LISTENERS ==========
// Join chat
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Mobile sidebar controls
menuBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebarMenu);
closeSidebar.addEventListener('click', closeSidebarMenu);
backBtn.addEventListener('click', () => {
    if (window.innerWidth < 1024) {
        // Show confirmation for mobile
        if (confirm('Leave chat?')) {
            socket.disconnect();
            chatScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
        }
    }
});

// Handle virtual keyboard on mobile
window.addEventListener('resize', () => {
    // Scroll to bottom when keyboard appears/disappears
    setTimeout(scrollToBottom, 300);
});

// ========== CHAT FUNCTIONS ==========
function joinChat() {
    const username = usernameInput.value.trim();
    
    if (username) {
        myUsername = username;
        socket.emit('join-chat', username);
        
        // Switch screens
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        // Update title
        chatTitleText.textContent = `Hi, ${username}!`;
        
        // Focus on message input
        setTimeout(() => {
            messageInput.focus();
            scrollToBottom();
        }, 300);
        
        // Add welcome message
        addSystemMessage(`Welcome to the chat, ${username}! 👋`);
        
        // Prevent accidental back navigation on mobile
        if ('standalone' in navigator || window.matchMedia('(display-mode: standalone)').matches) {
            // PWA mode
            history.pushState(null, null, location.href);
            window.onpopstate = function() {
                history.pushState(null, null, location.href);
            };
        }
    }
}

function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message && myUsername) {
        // Send to server
        socket.emit('send-message', message);
        
        // Add to UI immediately
        addMessage('sent', message, 'You');
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Stop typing indicator
        socket.emit('stop-typing');
        
        // Scroll to bottom
        scrollToBottom();
    }
}

// ========== SOCKET.IO EVENT HANDLERS ==========
socket.on('user-joined', (username) => {
    if (username !== myUsername) {
        addSystemMessage(`🎉 ${username} joined the chat`);
        playNotificationSound('join');
    }
});

socket.on('user-left', (username) => {
    if (username !== myUsername) {
        addSystemMessage(`👋 ${username} left the chat`);
    }
});

socket.on('receive-message', (data) => {
    if (data.user !== myUsername) {
        addMessage('received', data.text, data.user);
        playNotificationSound('message');
    }
});

socket.on('user-typing', (username) => {
    if (username !== myUsername) {
        typingUser.textContent = username;
        typingIndicator.classList.remove('hidden');
    }
});

socket.on('user-stop-typing', () => {
    typingIndicator.classList.add('hidden');
});

socket.on('update-users', (users) => {
    onlineUsers = users;
    updateOnlineUsers(users);
});

// ========== UI HELPER FUNCTIONS ==========
function addMessage(type, text, username) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-username">${username}</div>
        <div class="message-text">${text}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function updateOnlineUsers(users) {
    const count = users.length;
    onlineCount.textContent = `${count} online`;
    sidebarOnlineCount.textContent = count;
    
    // Update users list in sidebar
    usersList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <span class="user-dot"></span>
            <span class="user-name">${user}</span>
            ${user === myUsername ? '<span class="user-you">(You)</span>' : ''}
        `;
        usersList.appendChild(userItem);
    });
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function playNotificationSound(type) {
    // Simple beep sound for notifications
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = type === 'message' ? 800 : 1200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // Audio not supported - silently fail
    }
}

// ========== MOBILE-SPECIFIC FEATURES ==========
// Handle touch events for better mobile UX
messagesContainer.addEventListener('touchstart', () => {
    // Hide keyboard if user touches message area
    if (document.activeElement === messageInput) {
        messageInput.blur();
    }
});

// Handle app-like behavior
if (window.matchMedia('(display-mode: standalone)').matches) {
    // Running as PWA
    document.body.classList.add('pwa-mode');
}

// Prevent zoom on double-tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user was already in chat (for page refresh)
    const savedUsername = localStorage.getItem('chat-username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        usernameInput.focus();
    }
    
    // Auto-join on Enter key
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            joinChat();
            localStorage.setItem('chat-username', usernameInput.value);
        }
    });
});