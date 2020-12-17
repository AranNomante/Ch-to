const express = require("express");
const helmet = require("helmet");
const app = express();
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.youtube.com/iframe_api",
                'iframe-src', 'https://www.youtube.com/embed/',
                'https:\/\/www.youtube.com\/s\/player\/c88a8657\/www-widgetapi.vflset\/www-widgetapi.js'
            ],
            "frame-src": ["'self'", "https://www.youtube.com/"]
        },
    })
);
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

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
        fn.handleDisconnect(allClients, clientNames, subscriptions, rooms, socket, io);
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
        fn.joinRoom(obj, socket, rooms, subscriptions, io);
    });
    socket.on('room_action', (obj) => {
        fn.handleRoomAction(obj, socket, rooms, subscriptions, io);
    });
});

http.listen(port, function() {
    console.log('listening on *:' + port);
});