const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fn = require('./functions');
const allClients = [];
const clientNames = {};
const rooms = [];
const subscriptions = {};
app.use(express.static(__dirname + '/assets'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/landing', function(req, res) {
    res.sendFile(__dirname + '/landing.html');
});

io.on('connection', function(socket) {
    fn.handleConnection(allClients, socket);
    socket.on('disconnect', () => {
        fn.handleDisconnect(allClients, clientNames, subscriptions, rooms, socket);
    });
    socket.on('sendMessage', (recipient, msg) => {
        fn.sendMessage(socket.id, recipient, msg, io, subscriptions);
    });
    socket.on('getClientList', () => {
        fn.getClientList(allClients, socket);
    });
    socket.on('getClientNames', () => {
        fn.getClientNames(clientNames, socket);
    })
    socket.on('validateName', (name) => {
        fn.validateName(name, clientNames, socket);
    })
    socket.on('setName', (name) => {
        fn.setName(clientNames, name, socket.id);
    });
    socket.on('sendRoom', (room) => {
        fn.processRoom(room, rooms, socket, subscriptions);
    });
    socket.on('getRooms', () => {
        fn.getRooms(rooms, socket);
    });
    socket.on('getSubscriptions', () => {
        fn.getSubscriptions(subscriptions, socket);
    });
    socket.on('joinRoom', (obj) => {
        fn.joinRoom(obj, socket, rooms, subscriptions);
    })
});

http.listen(port, function() {
    console.log('listening on *:' + port);
});