let ws;
let currentUser = '';

function joinChat() {
    const input = document.getElementById('username-input').value.trim();
    if (input.length < 2) {
        alert("Please enter a valid username (min 2 chars)");
        return;
    }
    
    currentUser = input;
    
    // Connect to WebSockets
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onopen = () => {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('chat-screen').classList.add('active');
        document.getElementById('message-input').focus();
    };
    
    ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'history') {
            const container = document.getElementById('messages-container');
            container.innerHTML = ''; // Clear
            payload.data.forEach(msg => appendMessage(msg));
        }
        else if (payload.type === 'chat') {
            appendMessage(payload.data);
        }
    };
    
    ws.onclose = () => {
        alert("Connection to server lost. Reconnecting...");
        logout();
    };
}

function handleEnter(e, callback) {
    if (e.key === 'Enter') {
        callback();
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (text === '') return;
    
    const messageObj = {
        type: 'chat',
        user: currentUser,
        text: text
    };
    
    ws.send(JSON.stringify(messageObj));
    input.value = '';
    input.focus();
}

function appendMessage(msg) {
    const container = document.getElementById('messages-container');
    const isMine = msg.user === currentUser;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMine ? 'mine' : ''}`;
    
    msgDiv.innerHTML = `
        <div class="msg-meta">
            <span class="msg-user">${isMine ? 'You' : msg.user}</span>
            <span class="msg-time">${msg.time}</span>
        </div>
        <div class="msg-bubble">${escapeHTML(msg.text)}</div>
    `;
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function logout() {
    if (ws) ws.close();
    document.getElementById('chat-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    currentUser = '';
}
