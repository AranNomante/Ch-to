const express = require("express");
const helmet = require("helmet");
const app = express();
const rateLimit = require('express-rate-limit');
const slowDown = require("express-slow-down");
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV;
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
console.log('NODE_ENV is: ', (env) ? env : 'not set');
if (env === 'production') {
	app.use(express.static(__dirname + '/public-p'));
} else {
	app.use(express.static(__dirname + '/public-d'));
}
app.use(express.static(__dirname + '/assets'));
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.get('/landing', function(req, res) {
	res.sendFile(__dirname + '/landing.html');
});

io.on('connection', function(socket) {
	fn.handleConnection(allClients, socket); //safe
	socket.on('disconnect', () => { //safe
		fn.handleDisconnect(allClients, clientNames, subscriptions, rooms, socket, io, syncInfo);
	});
	socket.on('sendMessage', (recipient, msg) => { //safe
		fn.sendMessage(socket.id, recipient, msg, io, subscriptions);
	});
	socket.on('getClientList', () => { //safe
		fn.getClientList(allClients, socket);
	});
	socket.on('getClientNames', () => { //safe
		fn.getClientNames(clientNames, socket);
	})
	socket.on('validateName', (name) => { //safe
		fn.validateName(name, clientNames, socket);
	})
	socket.on('setName', (name) => { //safe
		fn.setName(clientNames, name, socket.id);
	});
	socket.on('sendRoom', (room) => { //safe
		fn.processRoom(room, rooms, socket, subscriptions);
	});
	socket.on('getRooms', () => { //safe
		fn.getRooms(rooms, socket);
	});
	socket.on('getSubscriptions', () => { //safe
		fn.getSubscriptions(subscriptions, socket);
	});
	socket.on('joinRoom', (obj) => { //safe
		fn.joinRoom(obj, socket, rooms, subscriptions, io);
	});
	socket.on('room_action', (obj) => { //safe
		fn.handleRoomAction(obj, socket, rooms, subscriptions, io, syncInfo);
	});
	socket.on('getSyncInfo', (obj) => { //safe
		fn.getSyncInfo(obj, socket, syncInfo);
	});
	socket.on('setSyncInfo', (obj) => { //safe
		fn.setSyncInfo(obj, syncInfo);
	});
	socket.on('invitation', (obj) => { //safe
		fn.handleInvitation(obj, socket, io);
	});
	socket.on('acceptInvitation', (obj) => { //safe
		fn.acceptInvitation(obj, socket, rooms, subscriptions, io);
	});
});

http.listen(port, function() {
	console.log('listening on *:' + port);
});
