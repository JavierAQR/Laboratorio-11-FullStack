const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server); 

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  const { room = 'general', name = 'Anon' } = socket.handshake.query;
  socket.data.name = name;

  socket.join(room);
  io.to(room).emit('system', `${name} se unió (${socket.id})`);

  socket.on('chat message', (text, ack) => {
    const message = { from: socket.data.name, text, at: Date.now() };
    socket.to(room).emit('chat message', message);
    if (typeof ack === 'function') ack('entregado');
  });

  socket.on('typing', (isTyping) => {
    socket.to(room).emit('typing', { from: socket.data.name, isTyping: !!isTyping });
  });

  socket.on('disconnect', (reason) => {
    io.to(room).emit('system', `${socket.data.name} salió`);
    console.log('Usuario desconectado:', socket.id, reason);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
});