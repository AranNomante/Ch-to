//init
const params = (new URL(document.location)).searchParams;
const name = params.get('name');
const socket = io();
if (!name) {
    window.location.href = '/landing';
} else if (name.length < 3 || name.length > 30) {
    window.location.href = '/landing?error=invalid';
} else {
    socket.emit('validateName', name);
}
let clients = [];
let clientNames = {};
let activeObj = {};
let rooms = [];
let subscriptions = {};
let ongoingSwitch = false;
let activeRoomMembers = {};
const chats = {}; // id:[{incoming:boolean,message:string,sender:string(roomonly)}]
const notifications = {};
//init

//socket
socket.on('validateNameResponse', function(isValid) {
    if (isValid) {
        socket.emit('setName', name);
        $('#username').text('Username: ' + name);
    } else {
        window.location.href = '/landing?error=taken';
    }
});
socket.on('updateClientList', function(clientList) {
    clients = clientList;
});
socket.on('updateClientNames', function(clientNameList) {
    clientNames = clientNameList;
    refreshUsers();
});
socket.on('newmsg', function(sender, msg, from = null) {
    //console.log(sender, msg, from);
    const c_1 =
        (!from) ? clientNames[sender] :
        (subscriptions[from] && !(from === socket.id)) ? true : false;
    if (c_1) {
        if (!(sender in chats)) {
            chats[sender] = [];
        }
        let pack_m = {
            incoming: true,
            message: msg
        };
        if (from) {
            pack_m.sender = from;
        } else {
            pack_m.sender = sender;
        }
        chats[sender].push(pack_m);
        //console.log(sender, msg, from);
        if (activeObj.id === sender) {
            $('.chat-panel').append(msgBuilder(true, msg, clientNames[pack_m.sender]));
            scrollToBottom('chat-panel');
        } else {
            if (!(sender in notifications)) {
                notifications[sender] = true;
            }
        }
    }
})
socket.on('sendRoomResponse', function(response) {
    //console.log(response);
    if (response.success) {
        //alert('Room created!');
        setSnack('Room created!');
        $('.create_room').hide();
    } else {
        let alertText = "Couldn't create room, reason(s):";
        if (response.reason === 'many') {
            if (!response.first) {
                alertText += '\nInvalid room name,' +
                    'room name must be at most 50 characters ';
            }
            if (!response.second) {
                alertText += '\nInvalid description,' +
                    'description must be at most 50 characters ';
            }
            if (!response.third) {
                alertText += '\nInvalid capacity,' +
                    'select a value between 1-100 ';
            }
            if (!response.fourth) {
                alertText += '\nRoom with given name already exists';
            }
            alertText += '\n\nOnly password field is allowed to be blank';
        } else {
            alertText += '\nCannot create/subscribe to more than one room';
        }
        //alert(alertText);
        setSnack(alertText);
    }
})
socket.on('updateRooms', function(rms) {
    rooms = rms;
    refreshRooms();
});
socket.on('updateSubs', function(subs) {
    subscriptions = subs;
    updateRoomMembers();
    updateActiveRoom();
});
socket.on('joinRoomResponse', function(response) {
    if (response.success) {
        //alert('Joined successfully');
        setSnack('Joined Successfully');
    } else {
        //alert("Couldn't join reason: " + response.reason);
        setSnack("Couldn't join reason: " + response.reason);
    }
})
//socket

//fn
function getClientInfo() {
    socket.emit('getClientList');
    socket.emit('getClientNames');
    socket.emit('getRooms');
    socket.emit('updateSubs');
    socket.emit('getSubscriptions');
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
                $('.chats').append(`<p class='chatUser' name=${item}>${clientNames[item]} 💬</p>`);
            }
        }
    });
    if (activeUser && clientNames[activeUser]) {
        $('.chats h5').after(`<p class='chatUser active' name=${activeUser}>${clientNames[activeUser]} 💬</p>`);
        notif.forEach(item => {
            $('.chatUser.active').after(`<p class='chatUser messageAlert' name=${item}>${clientNames[item]} 💬</p>`);
        });

    } else {
        notif.forEach(item => {
            $('.chats h5').after(`<p class='chatUser messageAlert' name=${item}>${clientNames[item]} 💬</p>`);
        });
    }
    checkActiveChat();
}

function checkActiveChat() {
    const c_1 = Object.keys(activeObj).length === 0;
    const c_2 = activeObj.type === 'user' && !(clientNames[activeObj.id]);
    const c_3 = activeObj.type === 'room' && (rooms.findIndex(function(rm, index) {
        if (rm.room_name === activeObj.id) {
            return true;
        }
    }) === -1);
    if (c_1 || c_2 || c_3) {
        $('.chat-input').hide();
        $('#active_recipient').removeClass('badge-success');
        $('#active_recipient').addClass('badge-danger');
        $('#active_recipient').text('No User');
    } else {
        $('.chat-input').show();
        $('#active_recipient').removeClass('badge-danger');
        $('#active_recipient').addClass('badge-success');
    }
}

function refreshRooms() {
    $('.create_room').nextAll().remove();
    let activeRoom;
    let notif = [];
    let subbed = [];
    rooms.forEach(item => {
        if (activeObj.type === 'room' && activeObj.id === item.room_name) {
            activeRoom = item;
        } else {
            if (item.room_name in notifications) {
                notif.push(item.room_name);
            } else if (item.room_name === subscriptions[socket.id]) {
                subbed.push(item.room_name);
            } else {
                $('.create_room').after(`<p class='room_tab' name="${item.room_name}">${item.room_name}</p>`);
            }
        }
    });
    if (activeRoom) {
        $('.create_room').after(`<p class='room_tab active' name="${activeRoom.room_name}">${activeRoom.room_name}</p>`);
        notif.forEach(item => {
            $('.room_tab.active').after(`<p class='room_tab messageAlert' name="${item}">${item}</p>`);
        });
        subbed.forEach(item => {
            $('.room_tab.active').after(`<p class='room_tab subbed' name="${item}">${item}</p>`);
        });
    } else {
        notif.forEach(item => {
            $('.create_room').after(`<p class='room_tab messageAlert' name="${item}">${item}</p>`);
        });
        subbed.forEach(item => {
            $('.create_room').after(`<p class='room_tab subbed' name="${item}">${item}</p>`);
        });
    }
    checkActiveChat();
}

function sendMessage() {
    const src = $('#main-input');
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
        if (activeObj.type === 'room') {
            chats[activeObj.id].sender = socket.id;
        }
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
    let from = (activeObj.type === 'room') ? activeObj.id : clientNames[activeObj.id];
    let chat = chats[activeObj.id];
    $('#active_recipient').text('Active Chat: ' + from);
    //console.log(chat);
    if (chat) {
        chat.forEach(msg => {
            if (!msg.sender) {
                $('.chat-panel').append(msgBuilder(msg.incoming, msg.message, from));
            } else {
                let senderName = clientNames[msg.sender];
                if (senderName) {
                    $('.chat-panel').append(msgBuilder(msg.incoming, msg.message, senderName));
                }
            }
        })
    }
    scrollToBottom('chat-panel');
    $('.chat-panel').fadeIn('slow');
    //console.log('switchChats');
}

function msgBuilder(incoming, message, from = null) {
    let color = (incoming) ? 'incoming' : 'outgoing';
    let elem = `<div class="row msgrow ${color}"><p class="msg ${color}">${(from && incoming)?from+':':''} ${message}</p></div>`;
    return elem;
}

function scrollToBottom(name) {
    let div = document.getElementsByClassName(name)[0];
    div.scrollTop = div.scrollHeight - div.clientHeight;
}

function chatUserAction() {
    if (!ongoingSwitch) {
        ongoingSwitch = true;
        activeObj = {
            type: 'user',
            id: $(this).attr('name')
        };
        $('.chatUser.active').removeClass('active');
        $('.room_tab.active').removeClass('active');
        $(this).addClass('active');
        switchChats();
        ongoingSwitch = false;
    }
}

function roomTabAction() {
    let name = $(this).attr('name');
    if (subscriptions[socket.id] === name) {
        roomJoin(name);
    } else {
        if (!(subscriptions[socket.id])) {
            let room_i = rooms.findIndex(function(rm, index) {
                if (rm.room_name === name) {
                    return true;
                }
            });
            if (!(room_i === -1)) {
                let cur_room = rooms[room_i];
                $('#room_modal').modal('show');
                $('.body_join').css('display', 'block');
                $('.body_create').css('display', 'none');
                $('#join_room_id').val(cur_room.room_name);
                let members_in_room = getRoomMembers(cur_room.room_name);
                $('#room_modal_title').text('Join Room: ' + cur_room.room_name);
                $('#read_room_owner').text('Owner: ' + clientNames[cur_room.owner]);
                $('#read_room_description').text('Description: ' + cur_room.description);
                $('#read_room_members').text('Capacity: ' + cur_room.member_count + '/' + cur_room.capacity);
                if (members_in_room.length > 0) {
                    let mem_str = ``;
                    members_in_room.forEach((item, i) => {
                        mem_str += `${(i + 1)}- ${item}\n`;
                    });
                    //console.log(mem_str);
                    $('#read_room_members_actual').text(mem_str);
                }
                if (!cur_room.protected) {
                    $('#room_protected').css('display', 'none');
                } else {
                    $('#room_protected').css('display', 'block');
                }
            }
        } else {
            //alert('You are already in a room!');
            setSnack('You are already in a room!');
        }
    }
}

function roomJoin(name) {
    if (!ongoingSwitch) {
        ongoingSwitch = true;
        activeObj = {
            type: 'room',
            id: name
        }
        $('.chatUser.active').removeClass('active');
        $('.room_tab.active').removeClass('active');
        $(this).addClass('active');
        switchChats();
        ongoingSwitch = false;
    }
}

function createRoom() {
    $('#room_modal').modal('show');
    $('.body_join').css('display', 'none');
    $('.body_create').css('display', 'block');
    $('#room_modal_title').text('Create Room');
}

function sendRoom() {
    if ($('.body_join').css('display') === 'block') {
        socket.emit('joinRoom', {
            room: $('#join_room_id').val(),
            pw: $('#insert_room_pw').val()
        });
    } else {
        socket.emit('sendRoom', {
            room_name: $('#create_room_name').val(),
            description: $('#create_room_description').val(),
            capacity: $('#create_room_members').val(),
            password: $('#create_room_password').val()
        });
    }
}

function updateRoomMembers() {
    let cur_room = subscriptions[socket.id];
    let members = {};
    if (cur_room) {
        Object.keys(subscriptions).forEach(key => {
            if (subscriptions[key] === cur_room && !(key === socket.id)) {
                let m_name = clientNames[key];
                if (m_name) {
                    members[key] = m_name;
                }
            }
        });
    }
    activeRoomMembers = members;
}

function getRoomMembers(rmname) {
    let members = [];
    Object.keys(subscriptions).forEach(key => {
        if (subscriptions[key] === rmname && clientNames[key]) {
            members.push(clientNames[key]);
        }
    });
    return members;
}

function closeModal(event) {
    const target = event.target;
    const id = target.id;
    if (id && $('#' + id).attr('class').split(' ').includes('modal')) {
        $('#' + id).modal('hide');
    }
}

function updateActiveRoom() {
    const room = subscriptions[socket.id];
    if (room) {
        const room_i = rooms.findIndex(function(rm, index) {
            if (rm.room_name === room) {
                return true;
            }
        });
        const cur_room = rooms[room_i];
        $('#room_a_title').text(cur_room.room_name);
        $('#room_a_desc').text(cur_room.description);
        $('#room_a_cap').text(cur_room.member_count + '/' + cur_room.capacity);
        const owner_flag = cur_room.owner === socket.id;
        if (!owner_flag) {
            $('#disband_room').parent().hide();
        } else {
            $('#disband_room').parent().show();
        }
        if (Object.keys(activeRoomMembers).length > 0) {
            let mem_str = ``;
            Object.keys(activeRoomMembers).forEach((key, i) => {
                mem_str += `${(i + 1)}- ${activeRoomMembers[key]}`;
                if (owner_flag) {
                    mem_str += `&nbsp;<button class="room_action kick_user" name="${key}">Kick 🚫</button><button class="room_action owner_transfer" name="${key}">Transfer Ownership 🛂</button>`;
                }
                mem_str += `<br>`;
            });
            $('#members_action').html(mem_str);
        }
    }
}

function handleRoomAction() {
    const cls = $(this).attr('class').split(' ');
    const id = $(this).attr('id');
    const name = $(this).attr('name');
    if (id) {
        if (id === 'disband_room') {
            socket.emit('room_action', {
                action: 'disband_room'
            });
        } else if (id === 'leave_room') {
            socket.emit('room_action', {
                action: 'leave_room'
            });
        }
    } else if (name) {
        if (cls.includes('owner_transfer')) {
            socket.emit('room_action', {
                action: 'owner_transfer',
                target: name
            });
        } else if (cls.includes('kick_user')) {
            socket.emit('room_action', {
                action: 'kick_user',
                target: name
            });
        }
    } else {
        setSnack('Something went wrong!');
    }
}
//fn

//js-jq
$(document).on('click', '.room_tab', roomTabAction);
$(document).on('click', '.chatUser', chatUserAction);
$(document).on('click', '#send_msg', sendMessage);
$(document).keyup(function(e) {
    if (e.which == 13) {
        $('#send_msg').click();
    }
});
$(document).on('click', '.modal', closeModal);
$(document).on('click', '.create_room', createRoom);
$(document).on('click', '#room_ok', sendRoom);
$(document).on('click', '.room_action', handleRoomAction);
setInterval(getClientInfo, 1000);
//js-jq