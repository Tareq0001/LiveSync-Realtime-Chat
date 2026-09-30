const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Store chat history in memory (Real Backend State)
const messageHistory = [];

wss.on('connection', (ws) => {
    console.log('New client connected!');
    
    // Send history to new user
    ws.send(JSON.stringify({ type: 'history', data: messageHistory }));

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            
            if (parsed.type === 'chat') {
                const chatData = {
                    id: Date.now(),
                    user: parsed.user,
                    text: parsed.text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                
                messageHistory.push(chatData);
                // Keep only last 50 messages
                if (messageHistory.length > 50) messageHistory.shift();
                
                // Broadcast to ALL clients
                const broadcastData = JSON.stringify({ type: 'chat', data: chatData });
                wss.clients.forEach((client) => {
                    if (client.readyState === 1) { // 1 = OPEN
                        client.send(broadcastData);
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('WebSocket server is active.');
});
