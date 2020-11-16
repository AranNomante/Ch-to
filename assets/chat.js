//init
const socket = io();
let clients = [];
let clientNames = {};
let activeObj = {};
const chats = {}; // id:[{incoming:boolean,message}]
let name = prompt("Please enter your name", "John Doe");
if (!name) {
    window.location.href = '/';
} else {
    socket.emit('validateName', name);
}
//init

//socket
socket.on('validateNameResponse', function(isValid) {
    if (isValid) {
        socket.emit('setName', name);
        $('#username').text('Username: ' + name);
    } else {
        alert('Name already taken');
        window.location.href = '/';
    }
});
socket.on('updateClientList', function(clientList) {
    clients = clientList;
});
socket.on('updateClientNames', function(clientNameList) {
    clientNames = clientNameList;
    refreshUsers();
});
socket.on('newmsg', function(msgObj) {
    console.log(msgObj);
})
//socket

//fn
function getClientInfo() {
    socket.emit('getClientList');
    socket.emit('getClientNames');
}

function refreshUsers() {
    //activeObj type user/room
    $('.chats').children().not(':first').remove();
    let activeUser;
    clients.forEach(item => {
        if (activeObj.type === 'user' && activeObj.id === item) {
            activeUser = item;
        } else if (clientNames[item]) {
            $('.chats').append(`<p class='chatUser' name=${item}>${clientNames[item]}</p>`);
        }
    });
    if (activeUser && clientNames[activeUser]) {
        $('.chats h5').after(`<p class='chatUser active' name=${activeUser}>${clientNames[activeUser]}</p>`);
    }
}

function sendMessage() {
    //clear input
    const src = $('#text_input');
    const msg = src.val();
    if (Object.keys(activeObj).length > 0 && msg) {
        socket.emit('sendMessage', activeObj, msg);
        if (!(activeObj.id in chats)) {
            chats[activeObj.id] = [];
        }
        chats[activeObj.id].push({
            incoming: false,
            message: msg
        });
        $('.chat-panel').append(msgBuilder(false, msg));
        src.val('');
    }
}

function switchChats() {
    //todo clear chat-panel, load from chats
    console.log('switchChats');
}

function msgBuilder(incoming, message) {
    let color = (incoming) ? 'incoming' : 'outgoing';
    let elem = `<div class="row msg ${color}">You: ${message}</div>`;
    return elem;
}
//fn

//js-jq
$(document).on('click', '.chatUser', function() {
    activeObj = {
        type: 'user',
        id: $(this).attr('name')
    };
    $('.chatUser.active').removeClass('active');
    $('.room.active').removeClass('active');
    $(this).addClass('active');
    switchChats();
});
$(document).on('click', '#send_msg', sendMessage);
setInterval(getClientInfo, 1000);
//js-jq
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