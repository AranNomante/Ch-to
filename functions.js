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

function sendMessage(sender, recipient, msg, io) {
    if (recipient.type === 'user') {
        io.to(recipient.id).emit('newmsg', sender, msg);
    } else {
        console.log('room chat');
    }
    console.log(sender, recipient, msg);
}

function handleDisconnect(array, array2, socket) {
    console.log('a user has disconnected:' + getSocketID(socket));
    let i = array.indexOf(getSocketID(socket));
    if (!(i === -1)) {
        removeArrayElem(array, i);
        delete array2[getSocketID(socket)];
    }
    console.log(array);
}

function handleConnection(array, socket) {
    console.log('a user has joined:' + getSocketID(socket));
    let i = array.indexOf(getSocketID(socket));
    if (i === -1) {
        array.push(getSocketID(socket));
    } else {
        console.log('user exists:' + getSocketID(socket))
    }
    console.log(array);
}

function validateName(name, obj, socket) {
    socket.emit('validateNameResponse', !Object.values(obj).includes(name));
}

function getClientNames(obj, socket) {
    socket.emit('updateClientNames', obj);
}

function processRoom(room, rooms, socket, subscriptions) {
    if (getSocketID(socket) in subscriptions) {
        socket.emit('sendRoomResponse', {
            success: false,
            reason: 'subscribed'
        })
        return;
    }
    room.capacity = Number(room.capacity);
    const name = room.room_name;
    const description = room.description;
    const capacity = room.capacity;
    const password = room.password;
    const first_condition =
        (name &&
            typeof name === "string" &&
            name.length < 50 &&
            name.length > 0);
    const second_condition =
        (description &&
            typeof description === "string" &&
            description.length < 50 &&
            description.length > 0);
    const third_condition =
        (capacity &&
            Number.isInteger(capacity) &&
            capacity > 0 &&
            capacity < 101);
    const fourth_condition = (rooms.findIndex(function(rm, index) {
        if (rm.name === name) {
            return true;
        }
    }) === -1);
    const fifth_condition = (
        password &&
        password.length > 0 &&
        password.length < 50
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
        room.owner = getSocketID(socket);
        rooms.push(room);
        subscriptions.push(getSocketID(socket));
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

function getRooms(rooms, socket) {
    let filtered_rooms = [];
    rooms.forEach(item => {
        filtered_rooms.push({
            room_name: item.room_name,
            description: item.description,
            capacity: item.capacity,
            protected: item.protected,
            member_count: item.member_count
        })
    });
    socket.emit('updateRooms', filtered_rooms);
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
    getRooms: getRooms
}