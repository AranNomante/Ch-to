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

function privateMessage(sender, recipient, msg) {
    console.log(data);
}

function handleDisconnect(array, array2, socket) {
    console.log('a user has disconnected:' + getSocketID(socket));
    let i = array.indexOf(getSocketID(socket));
    removeArrayElem(array, i);
    delete array2[socket.id];
}

function handleConnection(array, socket) {
    console.log('a user has joined:' + getSocketID(socket));
    array.push(socket.id);
}

function validateName(name, obj, socket) {
    socket.emit('validateNameResponse', !Object.values(obj).includes(name));
}

function getClientNames(obj, socket) {
    socket.emit('updateClientNames', obj);
}
module.exports = {
    getSocketID: getSocketID,
    removeArrayElem: removeArrayElem,
    setName: setName,
    getClientList: getClientList,
    privateMessage: privateMessage,
    handleDisconnect: handleDisconnect,
    handleConnection: handleConnection,
    validateName: validateName,
    getClientNames: getClientNames
}