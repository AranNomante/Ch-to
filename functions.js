function getSocketID(socket) {
    return socket.id;
}

function removeArrayElem(array, index) {
    array.splice(index, 1);
}

function setName(array, name, id) {
    array[id] = name;
}

function getClientList(array, socket) {
    let cloneArray = array.slice();
    let i = array.indexOf(getSocketID(socket));
    removeArrayElem(cloneArray, i);
    socket.emit('updateClientList', cloneArray);
}

function sendMessage(sender, recipient, msg, io, subscriptions) {
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

function handleDisconnect(clients, clientNames, subscriptions, rooms, socket) {
    const id = getSocketID(socket);
    //console.log('a user has disconnected:' + id);
    let i = clients.indexOf(id);
    if (!(i === -1)) {
        removeArrayElem(clients, i);
        delete clientNames[id];
        let cur_room = searchRoom(rooms, 'room_name', subscriptions[id]);
        if (!(cur_room === -1)) {
            rooms[cur_room].member_count--;
        }
        delete subscriptions[id];
        let room_i = searchRoom(rooms, 'owner', id);
        if (!(room_i === -1)) {
            let first_sub = getKeyByValue(subscriptions, rooms[room_i].room_name);
            if (first_sub) {
                rooms[room_i].owner = first_sub;
            } else {
                removeArrayElem(rooms, room_i);
            }
        }
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
    socket.emit('validateNameResponse', !Object.values(obj).includes(name));
}

function getClientNames(obj, socket) {
    socket.emit('updateClientNames', obj);
}

function processRoom(room, rooms, socket, subscriptions) {
    const sub_clear = checkSub(subscriptions, socket, 'sendRoomResponse');
    const id = getSocketID(socket);
    if (sub_clear) {
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

function joinRoom(obj, socket, rooms, subscriptions) {
    const id = getSocketID(socket);
    const sub_clear = checkSub(subscriptions, socket, 'joinRoomResponse');
    const room_name = obj.room;
    const room_pw = obj.pw;
    if (sub_clear) {
        let room_i = searchRoom(rooms, 'room_name', room_name);
        if (!(room_i === -1)) {
            let cur_room = rooms[room_i];
            if (cur_room.member_count === cur_room.capacity) {
                joinRoomResponse(false, 'room full', socket);
            } else {
                if (cur_room.protected && !(room_pw === cur_room.password)) {
                    joinRoomResponse(false, 'invalid room password', socket);
                } else {
                    rooms[room_i].member_count++;
                    subscriptions[id] = room_name;
                    socket.join(room_name);
                    joinRoomResponse(true, '', socket);
                }
            }
        } else {
            joinRoomResponse(false, 'room not found', socket);
        }
    }
}

function joinRoomResponse(scs, rsn, socket) {
    socket.emit('joinRoomResponse', {
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
module.exports = {
    getSocketID: getSocketID,
    removeArrayElem: removeArrayElem,
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
    joinRoom: joinRoom
}