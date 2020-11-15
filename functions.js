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

function handleDisconnect(array, socket) {
    console.log('a user has disconnected:' + getSocketID(socket));
    let i = array.indexOf(getSocketID(socket));
    removeArrayElem(array, i);
}

function handleConnection(array, socket) {
    console.log('a user has joined:' + getSocketID(socket));
    array.push(socket.id);
}
module.exports = {
    getSocketID: getSocketID,
    removeArrayElem: removeArrayElem,
    setName: setName,
    getClientList: getClientList,
    privateMessage: privateMessage,
    handleDisconnect: handleDisconnect,
    handleConnection: handleConnection
}