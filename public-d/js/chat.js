// init
const params = new URL(document.location).searchParams;
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
let roomSearchFilter = '';
let userSearchFilter = '';
// init

// socket
/**
    @name validateNameResponse
	@param {Boolean} isValid
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#validateNameResponse}
*/
socket.on('validateNameResponse', function (isValid) {
  if (isValid) {
    socket.emit('setName', name);
    $('#username').text(`${name}`);
  } else {
    window.location.href = '/landing?error=taken';
  }
});
/**
    @name updateClientList
	@param {Array} clientList
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#updateClientList}
*/
socket.on('updateClientList', function (clientList) {
  clients = clientList;
});
/**
    @name updateClientNames
	@param {Object} clientNameList
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#updateClientNames}
*/
socket.on('updateClientNames', function (clientNameList) {
  clientNames = clientNameList;
  refreshUsers();
});
/**
    @name newmsg
	@param {String} sender
	@param {String} msg
	@param {String} from
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#newmsg}
*/
socket.on('newmsg', function (sender, msg, from = null) {
  // console.log(sender, msg, from);
  const c1 = !from
    ? clientNames[sender]
    : subscriptions[from] && !(from === socket.id)
    ? true
    : false;
  if (c1) {
    if (!(sender in chats)) {
      chats[sender] = [];
    }
    const packM = {
      incoming: true,
      message: msg,
    };
    let snackName = null;
    if (from) {
      packM.sender = from;
      snackName = clientNames[from];
      if (snackName) {
        setSnack('New message from ' + snackName + ', in room:' + sender);
      }
    } else {
      packM.sender = sender;
      snackName = clientNames[sender];
      if (snackName) {
        setSnack('New message from ' + snackName);
      }
    }
    chats[sender].push(packM);
    // console.log(sender, msg, from);

    if (activeObj.id === sender) {
      $('.chat-panel').append(msgBuilder(true, msg, clientNames[packM.sender]));
      scrollToBottom('chat-panel');
    } else {
      if (!(sender in notifications)) {
        notifications[sender] = true;
      }
    }
  }
});
/**
    @name sendRoomResponse
	@param {Object} response
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendRoomResponse}
*/
socket.on('sendRoomResponse', function (response) {
  // console.log(response);
  if (response.success) {
    // alert('Room created!');
    setSnack('Room created!');
    $('.create_room').hide();
  } else {
    let alertText = "Couldn't create room, reason(s):";
    if (response.reason === 'many') {
      if (!response.first) {
        alertText +=
          '\nInvalid room name,' + 'room name must be at most 50 characters ';
      }
      if (!response.second) {
        alertText +=
          '\nInvalid description,' +
          'description must be at most 50 characters ';
      }
      if (!response.third) {
        alertText += '\nInvalid capacity,' + 'select a value between 1-100 ';
      }
      if (!response.fourth) {
        alertText += '\nRoom with given name already exists';
      }
      alertText += '\n\nOnly password field is allowed to be blank';
    } else {
      alertText += '\nCannot create/subscribe to more than one room';
    }
    // alert(alertText);
    setSnack(alertText);
  }
});
/**
    @name updateRooms
	@param {Array} rms
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#updateRooms}
*/
socket.on('updateRooms', function (rms) {
  rooms = rms;
  refreshRooms();
});
/**
    @name updateSubs
	@param {Object} subs
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#updateSubs}
*/
socket.on('updateSubs', function (subs) {
  subscriptions = subs;
  if (!subscriptions[socket.id]) {
    $('.create_room').show();
  }
  updateRoomMembers();
  updateActiveRoom();
});
/**
    @name joinRoomResponse
	@param {Object} response
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#joinRoomResponse}
*/
socket.on('joinRoomResponse', function (response) {
  if (response.success) {
    // alert('Joined successfully');
    setSnack('Joined Successfully!');
  } else {
    // alert("Couldn't join reason: " + response.reason);
    setSnack("Couldn't join reason: " + response.reason);
  }
});
/**
    @name room_action_response
	@param {Object} response
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#room_action_response}
*/
socket.on('room_action_response', function (response) {
  if (response.success) {
    setSnack('Success!');
  } else {
    setSnack('Failed, reason: ' + response.reason);
  }
});
/**
    @name roomalert
	@param {String} msg
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#roomalert}
*/
socket.on('roomalert', function (msg) {
  setSnack(msg.message);
});
/**
    @name invitation
	@param {Object} obj
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#invitation}
*/
socket.on('invitation', function (obj) {
  const id = obj.from;
  const toRoom = obj.toRoom;
  const nm = clientNames[id];
  if (nm) {
    setSnack(
      'You have been invited to a room(' +
        toRoom +
        ') by ' +
        nm +
        '.\nClick here to accept the invitation!'
    );
  }
});
// socket

// fn
/**
    @name getClientInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getClientInfo}
*/
function getClientInfo() {
  socket.emit('getClientList');
  socket.emit('getClientNames');
  socket.emit('getRooms');
  socket.emit('updateSubs');
  socket.emit('getSubscriptions');
}

/**
    @name refreshUsers
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#refreshUsers}
*/
function refreshUsers() {
  // activeObj type user/room
  $('#user_search').nextAll().remove();
  let activeUser;
  const notif = [];
  clients.forEach((item) => {
    if (activeObj.type === 'user' && activeObj.id === item) {
      activeUser = item;
    } else if (clientNames[item]) {
      if (item in notifications) {
        notif.push(item);
      } else {
        const inv = `<span class="invite ${
          !subscriptions[item] && subscriptions[socket.id] ? 'on' : 'off'
        }" name="${item}">🗣️</span>`;
        $('.chats').append(
          `<p class='chatUser' style='display:${
            clientNames[item].includes(userSearchFilter) ? 'block' : 'none'
          }' name="${item}">${clientNames[item]} 💬 ${inv}</p>`
        );
      }
    }
  });
  if (activeUser && clientNames[activeUser]) {
    let inv = `<span class="invite ${
      !subscriptions[activeUser] && subscriptions[socket.id] ? 'on' : 'off'
    }" name="${activeUser}">🗣️</span>`;
    $('#user_search').after(
      `<p class='chatUser active' name=${activeUser}>${clientNames[activeUser]} 💬 ${inv}</p>`
    );
    notif.forEach((item) => {
      inv = `<span class="invite ${
        !subscriptions[item] && subscriptions[socket.id] ? 'on' : 'off'
      }" name="${item}">🗣️</span>`;
      $('.chatUser.active').after(
        `<p class='chatUser messageAlert' style='display:${
          clientNames[item].includes(userSearchFilter) ? 'block' : 'none'
        }' name=${item}>${clientNames[item]} 💬 ${inv}</p>`
      );
    });
  } else {
    notif.forEach((item) => {
      const inv = `<span class="invite ${
        !subscriptions[item] && subscriptions[socket.id] ? 'on' : 'off'
      }" name="${item}">🗣️</span>`;
      $('#user_search').after(
        `<p class='chatUser messageAlert' style='display:${
          clientNames[item].includes(userSearchFilter) ? 'block' : 'none'
        }' name=${item}>${clientNames[item]} 💬 ${inv}</p>`
      );
    });
  }
  checkActiveChat();
}
/**
    @name checkActiveChat
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#checkActiveChat}
*/
function checkActiveChat() {
  const c1 = Object.keys(activeObj).length === 0;
  const c2 = activeObj.type === 'user' && !clientNames[activeObj.id];
  const c3 =
    activeObj.type === 'room' &&
    rooms.findIndex(function (rm, index) {
      if (rm.room_name === activeObj.id) {
        return true;
      }
    }) === -1;
  if (c1 || c2 || c3) {
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
/**
    @name refreshRooms
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#refreshRooms}
*/
function refreshRooms() {
  $('.create_room').nextAll().remove();
  let activeRoom;
  const notif = [];
  const subbed = [];
  rooms.forEach((item) => {
    if (activeObj.type === 'room' && activeObj.id === item.room_name) {
      activeRoom = item;
    } else {
      if (item.room_name in notifications) {
        notif.push(item.room_name);
      } else if (item.room_name === subscriptions[socket.id]) {
        subbed.push(item.room_name);
      } else {
        $('.create_room').after(
          `<p class='room_tab' style='display:${
            item.room_name.includes(roomSearchFilter) ? 'block' : 'none'
          }' name="${item.room_name}">${item.room_name}</p>`
        );
      }
    }
  });
  if (activeRoom) {
    $('.create_room').after(
      `<p class='room_tab active' name="${activeRoom.room_name}">${activeRoom.room_name}</p>`
    );
    notif.forEach((item) => {
      $('.room_tab.active').after(
        `<p class='room_tab messageAlert' style='display:${
          item.includes(roomSearchFilter) ? 'block' : 'none'
        }' name="${item}">${item}</p>`
      );
    });
    subbed.forEach((item) => {
      $('.room_tab.active').after(
        `<p class='room_tab subbed' name="${item}">${item}</p>`
      );
    });
  } else {
    notif.forEach((item) => {
      $('.create_room').after(
        `<p class='room_tab messageAlert' style='display:${
          item.includes(roomSearchFilter) ? 'block' : 'none'
        }' name="${item}">${item}</p>`
      );
    });
    subbed.forEach((item) => {
      $('.create_room').after(
        `<p class='room_tab subbed' name="${item}">${item}</p>`
      );
    });
  }
  checkActiveChat();
}
/**
    @name sendMessage
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendMessage_c}
*/
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
      message: msg,
    });
    if (activeObj.type === 'room') {
      chats[activeObj.id].sender = socket.id;
    }
    $('.chat-panel').append(msgBuilder(false, msg));
    src.val('');
    scrollToBottom('chat-panel');
  }
}
/**
    @name switchChats
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#switchChats}
*/
function switchChats() {
  $('.chat-panel').fadeOut(100);
  $('.chat-panel').children().remove();
  if (activeObj.id in notifications) {
    delete notifications[activeObj.id];
  }
  const from =
    activeObj.type === 'room' ? activeObj.id : clientNames[activeObj.id];
  const chat = chats[activeObj.id];
  $('#active_recipient').text('Active Chat: ' + from);
  // console.log(chat);
  if (chat) {
    chat.forEach((msg) => {
      if (!msg.sender) {
        $('.chat-panel').append(msgBuilder(msg.incoming, msg.message, from));
      } else {
        const senderName = clientNames[msg.sender];
        if (senderName) {
          $('.chat-panel').append(
            msgBuilder(msg.incoming, msg.message, senderName)
          );
        }
      }
    });
  }
  scrollToBottom('chat-panel');
  $('.chat-panel').fadeIn('slow');
  // console.log('switchChats');
}
/**
    @name msgBuilder
	@param {Boolean} incoming
	@param {String} message
	@param {String} from
	@return {String}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#msgBuilder}
*/
function msgBuilder(incoming, message, from = null) {
  const color = incoming ? 'incoming' : 'outgoing';
  const elem = `<div class="row msgrow ${color}"><p class="msg ${color}">${
    from && incoming ? from + ':' : ''
  } ${message}</p></div>`;
  return elem;
}
/**
    @name scrollToBottom
	@param {String} name
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#scrollToBottom}
*/
function scrollToBottom(name) {
  const div = document.getElementsByClassName(name)[0];
  div.scrollTop = div.scrollHeight - div.clientHeight;
}
/**
    @name chatUserAction
    @param {Object} event
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#chatUserAction}
*/
function chatUserAction(event) {
  if (!ongoingSwitch && $(event.target).attr('class').includes('chatUser')) {
    ongoingSwitch = true;
    activeObj = {
      type: 'user',
      id: $(this).attr('name'),
    };
    $('.chatUser.active').removeClass('active');
    $('.room_tab.active').removeClass('active');
    $(this).addClass('active');
    switchChats();
    ongoingSwitch = false;
  }
}
/**
    @name roomTabAction
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#roomTabAction}
*/
function roomTabAction() {
  const name = $(this).attr('name');
  if (subscriptions[socket.id] === name) {
    roomJoin(name);
  } else {
    if (!subscriptions[socket.id]) {
      const roomI = rooms.findIndex(function (rm, index) {
        if (rm.room_name === name) {
          return true;
        }
      });
      if (!(roomI === -1)) {
        const curRoom = rooms[roomI];
        $('#room_modal').modal('show');
        $('.body_join').css('display', 'block');
        $('.body_create').css('display', 'none');
        $('#join_room_id').val(curRoom.room_name);
        const membersInRoom = getRoomMembers(curRoom.room_name);
        $('#room_modal_title').text('Join Room: ' + curRoom.room_name);
        $('#read_room_owner').text('Owner: ' + clientNames[curRoom.owner]);
        $('#read_room_description').text('Description: ' + curRoom.description);
        $('#read_room_members').text(
          'Capacity: ' + curRoom.member_count + '/' + curRoom.capacity
        );
        if (membersInRoom.length > 0) {
          let memStr = ``;
          membersInRoom.forEach((item, i) => {
            memStr += `${i + 1}- ${item}\n`;
          });
          // console.log(mem_str);
          $('#read_room_members_actual').text(memStr);
        }
        if (!curRoom.protected) {
          $('#room_protected').css('display', 'none');
        } else {
          $('#room_protected').css('display', 'block');
        }
      }
    } else {
      // alert('You are already in a room!');
      setSnack('You are already in a room!');
    }
  }
}
/**
    @name roomJoin
	@param {String} name
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#roomJoin}
*/
function roomJoin(name) {
  if (!ongoingSwitch) {
    ongoingSwitch = true;
    activeObj = {
      type: 'room',
      id: name,
    };
    $('.chatUser.active').removeClass('active');
    $('.room_tab.active').removeClass('active');
    $(this).addClass('active');
    switchChats();
    ongoingSwitch = false;
  }
}
/**
    @name createRoom
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#createRoom}
*/
function createRoom() {
  $('#room_modal').modal('show');
  $('.body_join').css('display', 'none');
  $('.body_create').css('display', 'block');
  $('#room_modal_title').text('Create Room');
}
/**
    @name sendRoom
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendRoom}
*/
function sendRoom() {
  if ($('.body_join').css('display') === 'block') {
    socket.emit('joinRoom', {
      room: $('#join_room_id').val(),
      pw: $('#insert_room_pw').val(),
    });
  } else {
    socket.emit('sendRoom', {
      room_name: $('#create_room_name').val(),
      description: $('#create_room_description').val(),
      capacity: $('#create_room_members').val(),
      password: $('#create_room_password').val(),
    });
  }
}
/**
    @name updateRoomMembers
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#updateRoomMembers}
*/
function updateRoomMembers() {
  const curRoom = subscriptions[socket.id];
  const members = {};
  if (curRoom) {
    Object.keys(subscriptions).forEach((key) => {
      if (subscriptions[key] === curRoom && !(key === socket.id)) {
        const mName = clientNames[key];
        if (mName) {
          members[key] = mName;
        }
      }
    });
  }
  activeRoomMembers = members;
}
/**
    @name getRoomMembers
	@param {String} rmname
	@return {Array}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getRoomMembers}
*/
function getRoomMembers(rmname) {
  const members = [];
  Object.keys(subscriptions).forEach((key) => {
    if (subscriptions[key] === rmname && clientNames[key]) {
      members.push(clientNames[key]);
    }
  });
  return members;
}
/**
    @name closeModal
	@param {Object} event
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#closeModal}
*/
function closeModal(event) {
  const target = event.target;
  const id = target.id;
  if (
    id &&
    $('#' + id).attr('class') &&
    $('#' + id)
      .attr('class')
      .split(' ')
      .includes('modal')
  ) {
    $('#' + id).modal('hide');
  }
}
/**
    @name updateActiveRoom
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#updateActiveRoom}
*/
function updateActiveRoom() {
  $('#room_a_title').text('');
  $('#room_a_desc').text('');
  $('#room_a_cap').text('');
  $('#members_action').html('');
  const room = subscriptions[socket.id];
  if (room) {
    const roomI = rooms.findIndex(function (rm, index) {
      if (rm.room_name === room) {
        return true;
      }
    });
    const curRoom = rooms[roomI];
    $('#room_a_title').text(curRoom.room_name);
    $('#room_a_desc').text(curRoom.description);
    $('#room_a_cap').text(curRoom.member_count + '/' + curRoom.capacity);
    const ownerFlag = curRoom.owner === socket.id;
    if (!ownerFlag) {
      $('#disband_room').parent().hide();
    } else {
      $('#disband_room').parent().show();
    }
    if (Object.keys(activeRoomMembers).length > 0) {
      let memStr = ``;
      Object.keys(activeRoomMembers).forEach((key, i) => {
        memStr += `${i + 1}- ${activeRoomMembers[key]}`;
        if (ownerFlag) {
          memStr += `&nbsp;<button class="room_action kick_user" name="${key}">Kick 🚫</button><button class="room_action owner_transfer" name="${key}">Transfer Ownership 🛂</button>`;
        }
        memStr += `<br>`;
      });
      $('#members_action').html(memStr);
    }
  }
}
/**
    @name handleRoomAction
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleRoomAction_c}
*/
function handleRoomAction() {
  const cls = $(this).attr('class').split(' ');
  const id = $(this).attr('id');
  const name = $(this).attr('name');
  if (id) {
    if (id === 'disband_room') {
      socket.emit('room_action', {
        action: 'disband_room',
      });
    } else if (id === 'leave_room') {
      socket.emit('room_action', {
        action: 'leave_room',
      });
    }
  } else if (name) {
    if (cls.includes('owner_transfer')) {
      socket.emit('room_action', {
        action: 'owner_transfer',
        target: name,
      });
    } else if (cls.includes('kick_user')) {
      socket.emit('room_action', {
        action: 'kick_user',
        target: name,
      });
    }
  } else {
    setSnack('Something went wrong!');
  }
}
/**
    @name filterTab
	@param {String} id
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#filterTab}
*/
function filterTab(id) {
  const target = id === 'room_search' ? '.room_tab' : '.chatUser';
  const filter = $('#' + id).val();
  id === 'room_search'
    ? (roomSearchFilter = filter)
    : (userSearchFilter = filter);
  $(target)
    .toArray()
    .forEach((subTarg) => {
      if (
        !$(subTarg).text().includes(filter) &&
        !$(subTarg).attr('class').includes('active')
      ) {
        $(subTarg).css('display', 'none');
      } else {
        $(subTarg).css('display', 'block');
      }
    });
}
/**
    @name filter
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#filter}
*/
function filter() {
  filterTab(this.id);
}
/**
    @name handleInvite
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleInvite}
*/
function handleInvite() {
  const id = $(this).attr('name');
  const nm = clientNames[id];
  if (nm) {
    setSnack(nm + ' has been invited to the room you are in!');
    socket.emit('invitation', {
      target: subscriptions[socket.id],
      invited: id,
    });
  }
}
/**
    @name handleSnackInteraction
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleSnackInteraction}
*/
function handleSnackInteraction() {
  const txt = $(this).text();
  const inv = txt.includes('You have been invited to a room(');
  if (inv) {
    let targRoom = txt.split('(')[1];
    if (targRoom) {
      targRoom = targRoom.split(')')[0];
    }
    if (targRoom && targRoom.length > 0) {
      // console.log('emitting');
      socket.emit('acceptInvitation', targRoom);
    }
  }
}
// fn

// js-jq
$(document).on('click', '.room_tab', roomTabAction);
$(document).on('click', '.chatUser', chatUserAction);
$(document).on('click', '#send_msg', sendMessage);
$(document).keyup(function (e) {
  if (e.which == 13) {
    $('#send_msg').click();
  }
});
$(document).on('click', '.modal', closeModal);
$(document).on('click', '.create_room', createRoom);
$(document).on('click', '#room_ok', sendRoom);
$(document).on('click', '.room_action', handleRoomAction);
$(document).on('click', '.invite.on', handleInvite);
$(document).on('click', '#snackbar', handleSnackInteraction);
$('#room_search,#user_search').on('input', filter);
setInterval(getClientInfo, 1000);
// js-jq
