const socket = io();
let clients = [];
let clientNames = {};
socket.on('updateClientList', function(clientList) {
    clients = clientList;

})

function getClientList() {
    socket.emit('getClientList');
}
setInterval(getClientList, 1000);
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