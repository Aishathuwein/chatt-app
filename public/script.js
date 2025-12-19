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
    // ========== IMAGE SHARING ==========
const imageBtn = document.getElementById('image-btn');
const cameraBtn = document.getElementById('camera-btn');
const imageInput = document.getElementById('image-input');
const cameraInput = document.getElementById('camera-input');

// Image button click
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

// Camera button click
cameraBtn.addEventListener('click', () => {
    cameraInput.click();
});

// Handle image selection
imageInput.addEventListener('change', handleImageSelect);
cameraInput.addEventListener('change', handleImageSelect);

async function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image too large! Max 5MB.');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    // Vibration feedback
    vibrate('send');
    
    // Create preview message immediately
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        addImageMessage(imageUrl, 'Uploading...', 'You');
        
        // In a real app, you'd upload to a server here
        // For demo, we'll simulate upload and send base64
        simulateImageUpload(file, imageUrl);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
}

function simulateImageUpload(file, imageUrl) {
    // Simulate upload progress
    const progressBar = document.createElement('div');
    progressBar.className = 'upload-progress-bar';
    progressBar.style.width = '0%';
    
    // In a REAL app, you would:
    // 1. Upload to cloud storage (Firebase, AWS S3, etc.)
    // 2. Get a public URL
    // 3. Send that URL via socket.io
    
    // For demo, we'll simulate with setTimeout
    setTimeout(() => {
        progressBar.style.width = '30%';
    }, 300);
    
    setTimeout(() => {
        progressBar.style.width = '70%';
    }, 800);
    
    setTimeout(() => {
        progressBar.style.width = '100%';
        
        // Send image via socket (as base64 for demo)
        // In production, send URL only
        socket.emit('send-image', {
            imageData: imageUrl,
            filename: file.name,
            size: file.size
        });
        
        // Update message status
        updateLastMessageStatus('Sent');
        
        // Remove progress bar after 2 seconds
        setTimeout(() => {
            progressBar.remove();
        }, 2000);
        
    }, 1500);
}

function addImageMessage(imageSrc, caption = '', username = '') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${username === 'You' || username === myUsername ? 'sent' : 'received'}`;
    
    messageDiv.innerHTML = `
        <div class="message-username">${username}</div>
        <div class="image-message">
            <img src="${imageSrc}" alt="${caption}" loading="lazy">
            ${caption ? `<div class="image-caption">${caption}</div>` : ''}
        </div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // Add progress bar for sent images
    if (username === 'You' || username === myUsername) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'upload-progress';
        progressDiv.innerHTML = '<div class="upload-progress-bar"></div>';
        messageDiv.appendChild(progressDiv);
    }
}

function updateLastMessageStatus(status) {
    const lastMessage = messagesContainer.lastElementChild;
    if (lastMessage && lastMessage.querySelector('.message-time')) {
        const timeElement = lastMessage.querySelector('.message-time');
        timeElement.textContent = `${status} • ${timeElement.textContent.split('•')[1] || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Handle incoming images from server
socket.on('receive-image', (data) => {
    if (data.user !== myUsername) {
        addImageMessage(data.imageData, `Image from ${data.user}`, data.user);
        vibrate('message');
        playNotificationSound('message');
    }
});    addSystemMessage(`🎉 ${username} joined the chat`);
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
     // ========== OFFLINE MODE HANDLING ==========

// Check online status
window.addEventListener('online', () => {
    addSystemMessage("✅ Back online! Reconnecting...");
    socket.connect();
    // Try to rejoin if needed
    if (myUsername) {
        setTimeout(() => {
            socket.emit('join-chat', myUsername);
        }, 1000);
    }
});

window.addEventListener('offline', () => {
    addSystemMessage("⚠️ You're offline. Messages will send when back online.");
});

// Store unsent messages when offline
let offlineMessages = [];

// Modify sendMessage function to handle offline
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message && myUsername) {
        if (navigator.onLine) {
            // Online - send immediately
            socket.emit('send-message', message);
            addMessage('sent', message, 'You');
        } else {
            // Offline - store for later
            offlineMessages.push(message);
            addMessage('sent', message, 'You (offline)');
            addSystemMessage("Message saved. Will send when back online.");
            
            // Save to localStorage
            localStorage.setItem('offline_messages', JSON.stringify(offlineMessages));
        }
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        socket.emit('stop-typing');
        scrollToBottom();
    }
}

// Send stored messages when back online
function sendOfflineMessages() {
    if (offlineMessages.length > 0 && myUsername && navigator.onLine) {
        offlineMessages.forEach(msg => {
            socket.emit('send-message', msg);
        });
        offlineMessages = [];
        localStorage.removeItem('offline_messages');
        addSystemMessage("All offline messages sent!");
    }
}

// Load offline messages on startup
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('offline_messages');
    if (saved) {
        offlineMessages = JSON.parse(saved);
        if (offlineMessages.length > 0) {
            addSystemMessage(`You have ${offlineMessages.length} unsent messages.`);
        }
    }
});   // Audio not supported - silently fail
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
   // ========== VIBRATION FEEDBACK ==========
function vibrate(pattern = 50) {
    // Check if vibration is supported
    if ("vibrate" in navigator) {
        // Different patterns for different events
        let vibrationPattern = pattern;
        
        // If pattern is a string, use predefined patterns
        if (typeof pattern === 'string') {
            switch(pattern) {
                case 'message':
                    vibrationPattern = [100, 50, 100]; // Two short vibrations
                    break;
                case 'send':
                    vibrationPattern = 30; // Very short
                    break;
                case 'error':
                    vibrationPattern = [200, 100, 200]; // Long vibration pattern
                    break;
                case 'join':
                    vibrationPattern = [100, 50, 100, 50, 100]; // Happy pattern
                    break;
                default:
                    vibrationPattern = 50;
            }
        }
        
        try {
            navigator.vibrate(vibrationPattern);
        } catch (e) {
            // Silent fail if vibration fails
        }
    }
}

// Add vibration to these events:
function joinChat() {
    const username = usernameInput.value.trim();
    
    if (username) {
        myUsername = username;
        socket.emit('join-chat', username);
        
        // Vibration feedback
        vibrate('join');
        
        // ... rest of your existing code ...
    }
}
// ===== IMAGE SHARING =====
const cameraBtn = document.getElementById('camera-btn');
const galleryBtn = document.getElementById('gallery-btn');
const imageInput = document.getElementById('image-input');

// Open camera
cameraBtn.addEventListener('click', () => {
    imageInput.setAttribute('capture', 'environment');
    imageInput.click();
});

// Open gallery
galleryBtn.addEventListener('click', () => {
    imageInput.removeAttribute('capture');
    imageInput.click();
});

// Handle image selection
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF)');
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large! Maximum size is 5MB.');
        return;
    }
    
    // Preview and send
    previewAndSendImage(file);
});

function previewAndSendImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const imageData = event.target.result;
        
        // Create image message in chat
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        messageDiv.innerHTML = `
            <div class="message-username">You</div>
            <div class="image-container">
                <img src="${imageData}" alt="Shared image">
            </div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} • Sending...</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        
        // Send to server (simulated for now)
        setTimeout(() => {
            // In real app: socket.emit('send-image', imageData)
            messageDiv.querySelector('.message-time').textContent = 
                `${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} • Sent`;
            
            // Simulate others seeing it
            setTimeout(() => {
                addImageMessage(imageData, 'Alice', 'Nice picture!');
            }, 1000);
        }, 1500);
    };
    
    reader.readAsDataURL(file);
    imageInput.value = ''; // Reset input
}

// Function to display received images
function addImageMessage(imageSrc, username, caption = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received';
    messageDiv.innerHTML = `
        <div class="message-username">${username}</div>
        <div class="image-container">
            <img src="${imageSrc}" alt="${caption}">
            ${caption ? `<div style="padding: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 14px;">${caption}</div>` : ''}
        </div>
        <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}
// Modify sendMessage to add vibration
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message && myUsername) {
        // Vibration on send
        vibrate('send');
        
        // ... rest of your existing code ...
    }
}

// Add vibration to incoming messages
socket.on('receive-message', (data) => {
    if (data.user !== myUsername) {
        addMessage('received', data.text, data.user);
        vibrate('message'); // Vibrate on new message
        playNotificationSound('message');
    }
}); // Check if user was already in chat (for page refresh)
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