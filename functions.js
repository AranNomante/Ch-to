const sanitizeHtml = require('sanitize-html');

function getSocketID(socket) {
    return socket.id;
}

function removeArrayElem(array, index) {
    array.splice(index, 1);
}

function setName(array, name, id) {
    name = safeSanitize(name);
    array[id] = name;
}

function getClientList(array, socket) {
    let cloneArray = array.slice();
    let i = array.indexOf(getSocketID(socket));
    removeArrayElem(cloneArray, i);
    socket.emit('updateClientList', cloneArray);
}

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
            sendRoomAlert(io, active_room, 'A user has just disconnected from' + active_room + ' !');
        }
        let ownership_i = searchRoom(rooms, 'owner', id);
        handleAutoRoomTransf(ownership_i, subscriptions, rooms, io, syncInfo);
    }
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function handleConnection(array, socket) {
    const id = getSocketID(socket);
    //console.log('a user has joined:' + id);
    let i = array.indexOf(id);
    if (i === -1) {
        array.push(id);
    }
    /*else {
           console.log('user exists:' + id)
       }
       console.log(array);*/
}

function validateName(name, obj, socket) {
    name = safeSanitize(name);
    if (name) {
        socket.emit('validateNameResponse', !Object.values(obj).includes(name));
    } else {
        socket.emit('validateNameResponse', false);
    }
}

function getClientNames(obj, socket) {
    socket.emit('updateClientNames', obj);
}

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

function getSubscriptions(subs, socket) {
    socket.emit('updateSubs', subs);
}

function joinRoom(obj, socket, rooms, subscriptions, io) {
    const id = getSocketID(socket);
    const sub_clear = checkSub(subscriptions, socket, 'joinRoomResponse');
    const room_name = obj.room;
    const room_pw = obj.pw;
    let scs = true;
    let rs = '';
    if (sub_clear && obj) {
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
    genericRoomresponse('joinRoomResponse', scs, rs, socket);
}

function genericRoomresponse(rsp, scs, rsn, socket) {
    socket.emit(rsp, {
        success: scs,
        reason: rsn
    });
}

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

function searchRoom(rooms, compare, to) {
    let room_i = rooms.findIndex(function(rm, index) {
        if (rm[compare] === to) {
            return true;
        }
    });
    return room_i;
}

function handleRoomAction(obj, socket, rooms, subscriptions, io, syncInfo) {
    //console.log(io.sockets.connected);
    let scs = true;
    let rs = '';
    if (obj) {
        const id = getSocketID(socket);
        const subscription = subscriptions[id];
        if (subscription) {
            const room_i = searchRoom(rooms, 'room_name', subscription)
            const ownership_i = searchRoom(rooms, 'owner', id);
            if (room_i > -1) {
                let room_name = rooms[room_i].room_name;
                if (obj.action === 'leave_room') {
                    handleMemberCount(rooms, subscriptions, id);
                    delete subscriptions[id];
                    handleAutoRoomTransf(ownership_i, subscriptions, rooms, io, syncInfo);
                    socket.leave(room_name);
                    sendRoomAlert(io, room_name, 'A user has just left the ' + room_name + ' !');
                } else if (ownership_i > -1) {
                    let target_exists = obj.target && obj.target.length > 0;
                    switch (obj.action) {
                        case 'disband_room':
                            disband_room(rooms, subscriptions, room_i, io, syncInfo);
                            break;
                        case 'owner_transfer':
                            if (target_exists) {
                                transfer_owner(rooms, obj.target, room_i, io);
                            } else {
                                scs = false;
                                rs = 'could not found target';
                            }
                            break;
                        case 'kick_user':
                            if (target_exists) {
                                handleMemberCount(rooms, subscriptions, obj.target);
                                kick_user(subscriptions, obj.target, io);
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
    genericRoomresponse('room_action_response', scs, rs, socket);
}

function disband_room(rooms, subscriptions, target, io, syncInfo) {
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

function transfer_owner(rooms, target, room_i, io) {
    rooms[room_i].owner = target;
    sendRoomAlert(io, target, 'Ownership of ' + rooms[room_i].room_name + ' has been transferred to you!');
}

function kick_user(subscriptions, target, io) {
    let room_name = subscriptions[target];
    delete subscriptions[target];
    let socket = io.sockets.connected[target];
    socket.leave(room_name);
    sendRoomAlert(io, target, 'You have been kicked from ' + room_name + ' !');
}

function handleAutoRoomTransf(r_i, subscriptions, rooms, io, syncInfo) {
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

function handleMemberCount(rooms, subscriptions, id) {
    let cur_room = searchRoom(rooms, 'room_name', subscriptions[id]);
    //console.log(cur_room);
    if (!(cur_room === -1)) {
        rooms[cur_room].member_count--;
    }
}

function sendRoomAlert(io, target, msg) {
    msg = safeSanitize(msg);
    if (msg) {
        io.to(target).emit('roomalert', {
            message: msg
        });
    }
}

function clearRoom(room, namespace = '/', io) {
    let roomObj = io.nsps[namespace].adapter.rooms[room];
    if (roomObj) {
        // now kick everyone out of this room
        Object.keys(roomObj.sockets).forEach(function(id) {
            io.sockets.connected[id].leave(room);
        });
    }
}

function getSyncInfo(room_name, socket, syncInfo) {
    //console.log(syncInfo[obj].player1);
    room_name = safeSanitize(room_name);
    if (room_name) {
        socket.emit('synchronizePlayers', syncInfo[room_name]);
    }
}

function setSyncInfo(obj, syncInfo) {
    if (obj && obj.player_states && Object.keys(obj.player_states).length > 0) {
        syncInfo[obj.room_name] = obj.player_states;
    }
}

function handleInvitation(obj, socket, io) {
    //console.log(obj.invited);
    let target = safeSanitize(obj.target);
    if (target) {
        io.to(obj.invited).emit('invitation', {
            from: getSocketID(socket),
            toRoom: target
        });
    }
}

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
    genericRoomresponse('joinRoomResponse', scs, rs, socket);
}

function safeSanitize(obj) {
    if (typeof obj === 'string') {
        return sanitizeHtml(obj);
    }
    return '';
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