// server.js
// Simple Express static server + WebSocket chat broadcaster
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  console.log('Client connected');
  // send recent history
  if(typeof chatHistory !== 'undefined' && Array.isArray(chatHistory)){
    try{ ws.send(JSON.stringify({type:'history', messages: chatHistory})); }catch(e){}
  }
  ws.on('message', function incoming(message) {
    // normalize message as JSON
    let payload = null;
    try{ payload = JSON.parse(message); }catch(e){ payload = {type:'chat', user:'?', text:String(message)}; }
    if(!global.chatHistory) global.chatHistory = [];
    // store join and chat events with timestamp
    if(payload.type === 'chat' || payload.type === 'join'){
      const entry = { type: payload.type, user: payload.user || '?', text: payload.text || (payload.type==='join' ? 'joined' : ''), time: Date.now() };
      global.chatHistory.push(entry);
      if(global.chatHistory.length > 200) global.chatHistory.shift();
    }
    const out = JSON.stringify(payload);
    // Broadcast to all clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(out);
      }
    });
  });
  ws.on('close', ()=> console.log('Client disconnected'));
});

server.listen(port, () => {
  console.log(`Silly Cats server running at http://localhost:${port}`);
});
