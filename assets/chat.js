//init
const socket = io();
let clients = [];
let clientNames = {};
let activeObj = {};
let ongoingSwitch = false;
const chats = {}; // id:[{incoming:boolean,message:string,sender:string(roomonly)}]
const notifications = {};
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
socket.on('newmsg', function(sender, msg) {
    console.log(sender, msg);
    if (clientNames[sender]) {
        if (!(sender in chats)) {
            chats[sender] = [];
        }
        chats[sender].push({
            incoming: true,
            message: msg
        });
        if (activeObj.id === sender) {
            $('.chat-panel').append(msgBuilder(true, msg, clientNames[sender]));
            scrollToBottom('chat-panel');
        } else {
            if (!(sender in notifications)) {
                notifications[sender] = true;
            }
        }
    }
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
    let notif = [];
    clients.forEach(item => {
        if (activeObj.type === 'user' && activeObj.id === item) {
            activeUser = item;
        } else if (clientNames[item]) {
            if (item in notifications) {
                notif.push(item);
            } else {
                $('.chats').append(`<p class='chatUser' name=${item}>${clientNames[item]}</p>`);
            }
        }
    });
    if (activeUser && clientNames[activeUser]) {
        $('.chats h5').after(`<p class='chatUser active' name=${activeUser}>${clientNames[activeUser]}</p>`);
        notif.forEach(item => {
            $('.chatUser.active').after(`<p class='chatUser messageAlert' name=${item}>${clientNames[item]}</p>`);
        });

    } else {
        notif.forEach(item => {
            $('.chats h5').after(`<p class='chatUser messageAlert' name=${item}>${clientNames[item]}</p>`);
        });
    }
}

function sendMessage() {
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
        scrollToBottom('chat-panel');
    }
}

function switchChats() {
    $('.chat-panel').fadeOut(100);
    $('.chat-panel').children().remove();
    if (activeObj.id in notifications) {
        delete notifications[activeObj.id];
    }
    let from = clientNames[activeObj.id];
    let chat = chats[activeObj.id];
    $('#active_recipient').text('Active Chat: ' + from);
    console.log(chat);
    if (chat) {
        chat.forEach(msg => {
            if (!msg.sender) {
                $('.chat-panel').append(msgBuilder(msg.incoming, msg.message, from));
            }
        })
    }
    scrollToBottom('chat-panel');
    $('.chat-panel').fadeIn('slow');
    console.log('switchChats');
}

function msgBuilder(incoming, message, from = null) {
    let color = (incoming) ? 'incoming' : 'outgoing';
    let elem = `<div class="row msg ${color}">${(from && incoming)?from:'You'}: ${message}</div>`;
    return elem;
}

function scrollToBottom(name) {
    let div = document.getElementsByClassName(name)[0];
    div.scrollTop = div.scrollHeight - div.clientHeight;
}
//fn

//js-jq
$(document).on('click', '.chatUser', function() {
    if (!ongoingSwitch) {
        ongoingSwitch = true;
        activeObj = {
            type: 'user',
            id: $(this).attr('name')
        };
        $('.chatUser.active').removeClass('active');
        $('.room.active').removeClass('active');
        $(this).addClass('active');
        switchChats();
        ongoingSwitch = false;
    }
});
$(document).on('click', '#send_msg', sendMessage);
$(document).keyup(function(e) {
    if (e.which == 13) {
        $('#send_msg').click();
    }
});
setInterval(getClientInfo, 1000);
//js-jq