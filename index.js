const express = require("express");
const helmet = require("helmet");
const app = express();
const rateLimit = require('express-rate-limit');
const slowDown = require("express-slow-down");
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fn = require('./functions');
const allClients = [];
const clientNames = {};
const rooms = [];
const subscriptions = {};
const syncInfo = {}; //room_name:player_states{}
const limiter = new rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200
});
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 100:
    // request # 101 is delayed by  500ms
    // request # 102 is delayed by 1000ms
    // request # 103 is delayed by 1500ms
    // etc.
});
app.enable("trust proxy");
app.use(limiter);
app.use(speedLimiter);
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.youtube.com/", 'iframe-src'],
            "frame-src": ["'self'", "https://www.youtube.com/"]
        },
    })
);
app.disable("x-powered-by");
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
        fn.handleDisconnect(allClients, clientNames, subscriptions, rooms, socket, io, syncInfo);
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
        fn.handleRoomAction(obj, socket, rooms, subscriptions, io, syncInfo);
    });
    socket.on('getSyncInfo', (obj) => {
        fn.getSyncInfo(obj, socket, syncInfo);
    });
    socket.on('setSyncInfo', (obj) => {
        fn.setSyncInfo(obj, syncInfo);
    });
    socket.on('invitation', (obj) => {
        fn.handleInvitation(obj, socket, io);
    });
    socket.on('acceptInvitation', (obj) => {
        fn.acceptInvitation(obj, socket, rooms, subscriptions, io);
    });
});

http.listen(port, function() {
    console.log('listening on *:' + port);
});