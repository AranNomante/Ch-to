const socket = io();
let clients = [];
let clientNames = {};
let name = prompt("Please enter your name", "John Doe");
if (!name) {
    window.location.href = '/';
} else {
    socket.emit('validateName', name);
}
socket.on('validateNameResponse', function(isValid) {
    if (isValid) {
        socket.emit('setName', name);
    } else {
        alert('Name already taken');
        window.location.href = '/';
    }
})
socket.on('updateClientList', function(clientList) {
    clients = clientList;
});
socket.on('updateClientNames', function(clientNameList) {
    clientNames = clientNameList;
})

function getClientInfo() {
    socket.emit('getClientList');
    socket.emit('getClientNames');
}
setInterval(getClientInfo, 1000);
/*
$(function () {
var socket = io();
$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(msg));
  window.scrollTo(0, document.body.scrollHeight);
});
});*/