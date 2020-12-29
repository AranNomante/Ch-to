const sanitizeHtml = require('sanitize-html');
/**
    @name safeSanitize
    @param {Object} obj
    @return {String}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#safesanitize}
*/
function safeSanitize(obj) {
	if (typeof obj === 'string') {
		return sanitizeHtml(obj);
	}
	return '';
}
/**
    @name getSocketID
    @param {Object} socket
    @return {String}
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getSocketID}
*/
function getSocketID(socket) {
	return socket.id;
}
/**
    @name getKeyByValue
    @param {Object} object
    @param {Object} value
    @return {Object}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getKeyByValue}
*/
function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}
/**
    @name removeArrayElem
    @param {Array} array
    @param {Number} index
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#removeArrayElem}
*/
function removeArrayElem(array, index) {
	array.splice(index, 1);
}
/**
    @name setName
    @param {Object} clientNames
    @param {String} name
    @param {String} id
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#setName}
*/
function setName(clientNames, name, id) {
	name = safeSanitize(name);
	clientNames[id] = name;
}
/**
    @name validateName
    @param {String} name
    @param {Object} clientNames
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#validateName}
*/
function validateName(name, clientNames, socket) {
	name = safeSanitize(name);
	if (name) {
		socket.emit('validateNameResponse', !Object.values(clientNames).includes(name));
	} else {
		socket.emit('validateNameResponse', false);
	}
}
/**
    @name getClientList
    @param {Array} clients
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getClientList}
*/
function getClientList(clients, socket) {
	let cloneArray = clients.slice();
	let i = clients.indexOf(getSocketID(socket));
	removeArrayElem(cloneArray, i);
	socket.emit('updateClientList', cloneArray);
}
/**
    @name handleDisconnect
    @param {Array} clients
    @param {Object} clientNames
    @param {Object} subscriptions
    @param {Array} rooms
    @param {Object} socket
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleDisconnect}
*/
function handleDisconnect(clients, clientNames, subscriptions, rooms, socket, io, syncInfo) {
	const id = getSocketID(socket);
	//console.log('a user has disconnected:' + id);
	let i = clients.indexOf(id);
	if (!(i === -1)) {
		removeArrayElem(clients, i);
		delete clientNames[id];
		handleMemberCount(rooms, subscriptions, id);
		let active_room = subscriptions[id];
		delete subscriptions[id];
		if (active_room) {
			sendRoomAlert(io, active_room, 'A user has just disconnected from ' + active_room + ' !');
		}
		let ownership_i = searchRoom(rooms, 'owner', id);
		handleAutoRoomTransfer(ownership_i, subscriptions, rooms, io, syncInfo);
	}
}
/**
    @name handleConnection
    @param {Array} clients
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleConnection}
*/
function handleConnection(clients, socket) {
	const id = getSocketID(socket);
	//console.log('a user has joined:' + id);
	let i = clients.indexOf(id);
	if (i === -1) {
		clients.push(id);
	}
	/*else {
	       console.log('user exists:' + id)
	   }
	   console.log(array);*/
}
/**
    @name sendMessage
    @param {String} sender
    @param {Object} recipient
    @param {Object} io
    @param {Object} subscriptions
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendMessage}
*/
function sendMessage(sender, recipient, msg, io, subscriptions) {
	msg = safeSanitize(msg);
	if (recipient && recipient.id && msg) {
		if (recipient.type === 'user') {
			io.to(recipient.id).emit('newmsg', sender, msg, null);
		} else {
			//console.log('room chat');
			if (subscriptions[sender] === recipient.id) {
				io.to(recipient.id).emit('newmsg', recipient.id, msg, sender);
			}
		}
		//console.log(sender, recipient, msg);
	}
}
/**
    @name getClientNames
    @param {Object} clientNames
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getClientNames}
*/
function getClientNames(clientNames, socket) {
	socket.emit('updateClientNames', clientNames);
}
/**
    @name processRoom
    @param {Object} room
    @param {Array} rooms
    @param {Object} socket
    @param {Object} subscriptions
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#processRoom}
*/
function processRoom(room, rooms, socket, subscriptions) {
	const sub_clear = checkSub(subscriptions, socket, 'sendRoomResponse');
	const id = getSocketID(socket);
	if (sub_clear && room) {
		room.capacity = Number(room.capacity);
		const name = room.room_name;
		const description = room.description;
		const capacity = room.capacity;
		const password = room.password;
		const first_condition =
			(name &&
				typeof name === "string" &&
				name.length < 51 &&
				name.length > 0);
		const second_condition =
			(description &&
				typeof description === "string" &&
				description.length < 51 &&
				description.length > 0);
		const third_condition =
			(capacity &&
				Number.isInteger(capacity) &&
				capacity > 0 &&
				capacity < 101);
		const fourth_condition = searchRoom(rooms, 'room_name', name) === -1;
		const fifth_condition = (
			password &&
			password.length > 0 &&
			password.length < 51
		);
		if (
			first_condition &&
			second_condition &&
			third_condition &&
			fourth_condition
		) {
			if (fifth_condition) {
				room.protected = true;
			} else {
				room.protected = false;
			}
			room.member_count = 1;
			room.owner = id;
			rooms.push(room);
			subscriptions[id] = name;
			socket.join(name);
			socket.emit('sendRoomResponse', {
				success: true
			});
		} else {
			socket.emit('sendRoomResponse', {
				success: false,
				reason: 'many',
				first: first_condition,
				second: second_condition,
				third: third_condition,
				fourth: fourth_condition
			});
		}
	}
}
/**
    @name getRooms
    @param {Array} rooms
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getRooms}
*/
function getRooms(rooms, socket) {
	let filtered_rooms = [];
	rooms.forEach(item => {
		filtered_rooms.push({
			room_name: item.room_name,
			description: item.description,
			capacity: item.capacity,
			protected: item.protected,
			member_count: item.member_count,
			owner: item.owner
		})
	});
	socket.emit('updateRooms', filtered_rooms);
}
/**
    @name getSubscriptions
    @param {Object} subscriptions
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getSubscriptions}
*/
function getSubscriptions(subscriptions, socket) {
	socket.emit('updateSubs', subscriptions);
}
/**
    @name joinRoom
    @param {Object} form
    @param {Object} socket
    @param {Array} rooms
    @param {Object} subscriptions
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#joinRoom}
*/
function joinRoom(form, socket, rooms, subscriptions, io) {
	const id = getSocketID(socket);
	const sub_clear = checkSub(subscriptions, socket, 'joinRoomResponse');
	const room_name = form.room;
	const room_pw = form.pw;
	let scs = true;
	let rs = '';
	if (sub_clear && form) {
		let room_i = searchRoom(rooms, 'room_name', room_name);
		if (!(room_i === -1)) {
			let cur_room = rooms[room_i];
			if (cur_room.member_count === cur_room.capacity) {
				scs = false;
				rs = 'room full';
			} else {
				if (cur_room.protected && !(room_pw === cur_room.password)) {
					scs = false;
					rs = 'invalid password';
				} else {
					sendRoomAlert(io, room_name, 'A user has just joined the ' + room_name + ' !');
					rooms[room_i].member_count++;
					subscriptions[id] = room_name;
					socket.join(room_name);
				}
			}
		} else {
			scs = false;
			rs = 'room not found';
		}
	} else {
		scs = false;
		rs = 'invalid room';
	}
	genericRoomResponse('joinRoomResponse', scs, rs, socket);
}
/**
    @name genericRoomResponse
    @param {String} response
    @param {Boolean} success
    @param {String} reason
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#genericRoomResponse}
*/
function genericRoomResponse(response, success, reason, socket) {
	socket.emit(response, {
		success: success,
		reason: reason
	});
}
/**
    @name checkSub
    @param {Object} subscriptions
    @param {Object} socket
    @param {String} sockmsg
    @return {Boolean}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#checkSub}
*/
function checkSub(subscriptions, socket, sockmsg) {
	if (subscriptions[getSocketID(socket)]) {
		socket.emit(sockmsg, {
			success: false,
			reason: 'subscribed'
		})
		return false;
	}
	return true;
}
/**
    @name searchRoom
    @param {Array} rooms
    @param {Object} compare
    @param {Object} to
    @return {Number}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#searchRoom}
*/
function searchRoom(rooms, compare, to) {
	let room_i = rooms.findIndex(function(rm, index) {
		if (rm[compare] === to) {
			return true;
		}
	});
	return room_i;
}
/**
    @name handleRoomAction
    @param {Object} form
    @param {Object} socket
    @param {Array} rooms
    @param {Object} subscriptions
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleRoomAction}
*/
function handleRoomAction(form, socket, rooms, subscriptions, io, syncInfo) {
	//console.log(io.sockets.connected);
	let scs = true;
	let rs = '';
	if (form) {
		const id = getSocketID(socket);
		const subscription = subscriptions[id];
		if (subscription) {
			const room_i = searchRoom(rooms, 'room_name', subscription)
			const ownership_i = searchRoom(rooms, 'owner', id);
			if (room_i > -1) {
				let room_name = rooms[room_i].room_name;
				if (form.action === 'leave_room') {
					handleMemberCount(rooms, subscriptions, id);
					delete subscriptions[id];
					handleAutoRoomTransfer(ownership_i, subscriptions, rooms, io, syncInfo);
					socket.leave(room_name);
					sendRoomAlert(io, room_name, 'A user has just left the ' + room_name + ' !');
				} else if (ownership_i > -1) {
					let target_exists = form.target && form.target.length > 0;
					switch (form.action) {
						case 'disband_room':
							disbandRoom(rooms, subscriptions, room_i, io, syncInfo);
							break;
						case 'owner_transfer':
							if (target_exists) {
								transferOwner(rooms, form.target, room_i, io);
							} else {
								scs = false;
								rs = 'could not found target';
							}
							break;
						case 'kick_user':
							if (target_exists) {
								handleMemberCount(rooms, subscriptions, form.target);
								kickUser(subscriptions, form.target, io);
							} else {
								scs = false;
								rs = 'could not found target';
							}
							break;
						default:
							scs = false;
							rs = 'invalid action';
							break;
					}
				} else {
					scs = false;
					rs = 'not owner';
				}
			} else {
				scs = false;
				rs = 'room not found';
			}
		} else {
			scs = false;
			rs = 'not subscribed';
		}
	} else {
		scs = false;
		rs = 'invalid action';
	}
	genericRoomResponse('room_action_response', scs, rs, socket);
}
/**
    @name disbandRoom
    @param {Array} rooms
    @param {Object} subscriptions
    @param {String} target
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#disbandRoom}
*/
function disbandRoom(rooms, subscriptions, target, io, syncInfo) {
	let room_name = rooms[target].room_name;
	sendRoomAlert(io, rooms[target].room_name, room_name + ' has been disbanded!');
	clearRoom(rooms[target].room_name, '/', io);
	let first_sub = getKeyByValue(subscriptions, room_name);
	while (first_sub) {
		delete subscriptions[first_sub];
		first_sub = getKeyByValue(subscriptions, room_name);
	}
	removeArrayElem(rooms, target);
	delete syncInfo[room_name];
}
/**
    @name transferOwner
    @param {Array} rooms
    @param {String} target
    @param {Number} room_i
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#transferOwner}
*/
function transferOwner(rooms, target, room_i, io) {
	rooms[room_i].owner = target;
	sendRoomAlert(io, target, 'Ownership of ' + rooms[room_i].room_name + ' has been transferred to you!');
}
/**
    @name kickUser
    @param {Object} subscriptions
    @param {String} target
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#kickUser}
*/
function kickUser(subscriptions, target, io) {
	let room_name = subscriptions[target];
	delete subscriptions[target];
	let socket = io.sockets.connected[target];
	socket.leave(room_name);
	sendRoomAlert(io, target, 'You have been kicked from ' + room_name + ' !');
}
/**
    @name handleAutoRoomTransfer
    @param {Number} r_i
    @param {Object} subscriptions
    @param {Array} rooms
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleAutoRoomTransfer}
*/
function handleAutoRoomTransfer(r_i, subscriptions, rooms, io, syncInfo) {
	if (!(r_i === -1)) {
		let room_name = rooms[r_i].room_name;
		let first_sub = getKeyByValue(subscriptions, room_name);
		if (first_sub) {
			rooms[r_i].owner = first_sub;
			sendRoomAlert(io, first_sub, 'Ownership of ' + room_name + ' has been transferred to you due to owners disconnection!');
		} else {
			removeArrayElem(rooms, r_i);
			delete syncInfo[room_name];
		}
	}
}
/**
    @name handleMemberCount
    @param {Array} rooms
    @param {Object} subscriptions
    @param {String} id
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleMemberCount}
*/
function handleMemberCount(rooms, subscriptions, id) {
	let cur_room = searchRoom(rooms, 'room_name', subscriptions[id]);
	//console.log(cur_room);
	if (!(cur_room === -1)) {
		rooms[cur_room].member_count--;
	}
}
/**
    @name sendRoomAlert
    @param {Object} io
    @param {String} target
    @param {String} msg
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendRoomAlert}
*/
function sendRoomAlert(io, target, msg) {
	msg = safeSanitize(msg);
	if (msg) {
		io.to(target).emit('roomalert', {
			message: msg
		});
	}
}
/**
    @name clearRoom
    @param {String} room
    @param {String} namespace
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#clearRoom}
*/
function clearRoom(room, namespace = '/', io) {
	let roomObj = io.nsps[namespace].adapter.rooms[room];
	if (roomObj) {
		// now kick everyone out of this room
		Object.keys(roomObj.sockets).forEach(function(id) {
			io.sockets.connected[id].leave(room);
		});
	}
}
/**
    @name getSyncInfo
    @param {String} room_name
    @param {Object} socket
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getSyncInfo}
*/
function getSyncInfo(room_name, socket, syncInfo) {
	//console.log(syncInfo[obj].player1);
	room_name = safeSanitize(room_name);
	if (room_name) {
		socket.emit('synchronizePlayers', syncInfo[room_name]);
	}
}
/**
    @name setSyncInfo
    @param {Object} playerInfo
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#setSyncInfo}
*/
function setSyncInfo(playerInfo, syncInfo) {
	if (playerInfo && playerInfo.player_states && Object.keys(playerInfo.player_states).length > 0) {
		syncInfo[playerInfo.room_name] = playerInfo.player_states;
	}
}
/**
    @name handleInvitation
    @param {Object} invitation
    @param {Object} socket
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleInvitation}
*/
function handleInvitation(invitation, socket, io) {
	//console.log(obj.invited);
	let target = safeSanitize(invitation.target);
	if (target) {
		io.to(invitation.invited).emit('invitation', {
			from: getSocketID(socket),
			toRoom: target
		});
	}
}
/**
    @name acceptInvitation
    @param {String} room_name
    @param {Object} socket
    @param {Array} rooms
    @param {Object} subscriptions
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#acceptInvitation}
*/
function acceptInvitation(room_name, socket, rooms, subscriptions, io) {
	let scs = true;
	let rs = '';
	if (room_name) {
		const sub_clear = checkSub(subscriptions, socket, 'joinRoomResponse');
		const room_i = searchRoom(rooms, 'room_name', room_name);
		const id = getSocketID(socket);
		if (sub_clear && !(room_i === -1)) {
			let cur_room = rooms[room_i];
			if (cur_room.member_count === cur_room.capacity) {
				scs = false;
				rs = 'Room capacity reached!';
			} else {
				sendRoomAlert(io, room_name, 'A user has just joined the ' + room_name + ' !');
				rooms[room_i].member_count++;
				subscriptions[id] = room_name;
				socket.join(room_name);
			}
		} else {
			scs = false;
			rs = 'Room does not exist!';
		}
	} else {
		scs = false;
		rs = 'invalid room';
	}
	genericRoomResponse('joinRoomResponse', scs, rs, socket);
}


module.exports = {
	setName: setName,
	getClientList: getClientList,
	sendMessage: sendMessage,
	handleDisconnect: handleDisconnect,
	handleConnection: handleConnection,
	validateName: validateName,
	getClientNames: getClientNames,
	processRoom: processRoom,
	getRooms: getRooms,
	getSubscriptions: getSubscriptions,
	joinRoom: joinRoom,
	handleRoomAction: handleRoomAction,
	setSyncInfo: setSyncInfo,
	getSyncInfo: getSyncInfo,
	handleInvitation: handleInvitation,
	acceptInvitation: acceptInvitation
}
