const socket = io();
let myUsername = '';
let onlineUsers = [];
let typingTimeout;
let mediaRecorder = null;
let audioChunks = [];
let audioRecordingTimer = null;
let recordingSeconds = 0;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const onlineCount = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');
const typingUser = document.getElementById('typing-user');
const usersList = document.getElementById('users-list');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');

const audioBtn = document.getElementById('audio-btn');
const stopAudioBtn = document.getElementById('stop-audio-btn');
const audioRecording = document.getElementById('audio-recording');
const recordingTime = document.getElementById('recording-time');
const cancelAudioBtn = document.getElementById('cancel-audio');
const cameraBtn = document.getElementById('camera-btn');
const galleryBtn = document.getElementById('gallery-btn');
const imageInput = document.getElementById('image-input');

joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    if (myUsername && this.value.trim().length > 0) {
        socket.emit('typing', myUsername);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing');
        }, 1000);
    }
});

menuBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebarMenu);
closeSidebar.addEventListener('click', closeSidebarMenu);

function toggleSidebar() {
    sidebar.classList.toggle('sidebar-open');
    sidebarOverlay.classList.toggle('showing');
}

function closeSidebarMenu() {
    sidebar.classList.remove('sidebar-open');
    sidebarOverlay.classList.remove('showing');
}

function joinChat() {
    const username = usernameInput.value.trim();
    
    if (username) {
        myUsername = username;
        socket.emit('join-chat', username);
        
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        setTimeout(() => {
            messageInput.focus();
            scrollToBottom();
        }, 300);
        
        addSystemMessage(`Welcome to the chat, ${username}! 👋`);
    }
}

function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message && myUsername) {
        socket.emit('send-message', message);
        addMessage('sent', message, 'You');
        messageInput.value = '';
        messageInput.style.height = 'auto';
        socket.emit('stop-typing');
        scrollToBottom();
    }
}

socket.on('user-joined', (username) => {
    if (username !== myUsername) {
        addSystemMessage(`🎉 ${username} joined the chat`);
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
    
    usersList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <span class="user-dot"></span>
            <span class="user-name">${user}</span>
            ${user === myUsername ? '<span style="font-size:12px;color:#666;">(You)</span>' : ''}
        `;
        usersList.appendChild(userItem);
    });
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// IMAGE SHARING
if (cameraBtn && galleryBtn) {
    cameraBtn.addEventListener('click', () => {
        imageInput.setAttribute('capture', 'environment');
        imageInput.click();
    });

    galleryBtn.addEventListener('click', () => {
        imageInput.removeAttribute('capture');
        imageInput.click();
    });
}

imageInput.addEventListener('change', handleImageSelect);

let lastImageId = null;

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        alert('Image too large! Max 2MB.');
        return;
    }
    
    lastImageId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        
        showImageMessage(base64Image, myUsername, 'You', 'Sending...', lastImageId);
        
        socket.emit('send-image', {
            imageUrl: base64Image,
            imageId: lastImageId,
            filename: file.name
        });
    };
    
    reader.readAsDataURL(file);
    imageInput.value = '';
}

socket.on('receive-image', (data) => {
    if (data.user !== myUsername) {
        showImageMessage(data.imageUrl, data.user, data.user, '', data.imageId);
    }
});

socket.on('image-sent-confirm', (data) => {
    if (data.imageId === lastImageId) {
        updateImageStatus(data.imageId, 'Sent');
        lastImageId = null;
    }
});

function showImageMessage(imageUrl, senderUsername, displayName, status, imageId) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${senderUsername === myUsername ? 'sent' : 'received'}`;
    messageDiv.dataset.imageId = imageId;
    
    messageDiv.innerHTML = `
        <div class="message-username">${displayName}</div>
        <div class="image-container">
            <img src="${imageUrl}" alt="Shared image">
        </div>
        <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} • ${status}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function updateImageStatus(imageId, newStatus) {
    const message = document.querySelector(`[data-image-id="${imageId}"]`);
    if (message) {
        const timeElement = message.querySelector('.message-time');
        if (timeElement) {
            const currentTime = timeElement.textContent.split('•')[0].trim();
            timeElement.textContent = `${currentTime} • ${newStatus}`;
        }
    }
}

// AUDIO RECORDING
if (audioBtn && stopAudioBtn && cancelAudioBtn) {
    audioBtn.addEventListener('click', startAudioRecording);
    stopAudioBtn.addEventListener('click', stopAudioRecording);
    cancelAudioBtn.addEventListener('click', cancelAudioRecording);
}

async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendAudioMessage(audioBlob);
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        
        audioBtn.classList.add('hidden');
        stopAudioBtn.classList.remove('hidden');
        audioRecording.classList.remove('hidden');
        
        recordingSeconds = 0;
        updateRecordingTime();
        audioRecordingTimer = setInterval(updateRecordingTime, 1000);
        
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Cannot access microphone. Please check permissions.');
    }
}

function updateRecordingTime() {
    recordingSeconds++;
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function stopAudioRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        resetAudioUI();
    }
}

function cancelAudioRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    resetAudioUI();
}

function resetAudioUI() {
    audioBtn.classList.remove('hidden');
    stopAudioBtn.classList.add('hidden');
    audioRecording.classList.add('hidden');
    
    if (audioRecordingTimer) {
        clearInterval(audioRecordingTimer);
        audioRecordingTimer = null;
    }
}

let lastAudioId = null;

function sendAudioMessage(audioBlob) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Audio = e.target.result;
        lastAudioId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        showAudioMessage(base64Audio, myUsername, 'You', 'Sending...', lastAudioId, recordingSeconds);
        
        socket.emit('send-audio', {
            audioUrl: base64Audio,
            audioId: lastAudioId,
            duration: recordingSeconds
        });
        
        recordingSeconds = 0;
    };
    reader.readAsDataURL(audioBlob);
}

socket.on('receive-audio', (data) => {
    if (data.user !== myUsername) {
        showAudioMessage(data.audioUrl, data.user, data.user, '', data.audioId, data.duration);
    }
});

socket.on('audio-sent-confirm', (data) => {
    if (data.audioId === lastAudioId) {
        updateAudioStatus(data.audioId, 'Sent');
        lastAudioId = null;
    }
});

function showAudioMessage(audioUrl, senderUsername, displayName, status, audioId, duration) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${senderUsername === myUsername ? 'sent' : 'received'}`;
    messageDiv.dataset.audioId = audioId;
    
    const durationText = formatDuration(duration);
    
    messageDiv.innerHTML = `
        <div class="message-username">${displayName}</div>
        <div class="audio-message">
            <button class="audio-play-btn" onclick="playAudio('${audioUrl}')">
                <i class="fas fa-play"></i>
            </button>
            <div class="audio-duration">${durationText}</div>
        </div>
        <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} • ${status}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateAudioStatus(audioId, newStatus) {
    const message = document.querySelector(`[data-audio-id="${audioId}"]`);
    if (message) {
        const timeElement = message.querySelector('.message-time');
        if (timeElement) {
            const currentTime = timeElement.textContent.split('•')[0].trim();
            timeElement.textContent = `${currentTime} • ${newStatus}`;
        }
    }
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
}