const sanitizeHtml = require('sanitize-html');
/**
    @name safeSanitize
    @param {Object} obj
    @return {String}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#safesanitize}
*/
function safeSanitize(obj) {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }
  return '';
}
/**
    @name getSocketID
    @param {Object} socket
    @return {String}
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getSocketID}
*/
function getSocketID(socket) {
  return socket.id;
}
/**
    @name getKeyByValue
    @param {Object} object
    @param {Object} value
    @return {Object}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getKeyByValue}
*/
function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}
/**
    @name removeArrayElem
    @param {Array} array
    @param {Number} index
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#removeArrayElem}
*/
function removeArrayElem(array, index) {
  array.splice(index, 1);
}
/**
    @name setName
    @param {Object} clientNames
    @param {String} name
    @param {String} id
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#setName}
*/
function setName(clientNames, name, id) {
  name = safeSanitize(name);
  clientNames[id] = name;
}
/**
    @name validateName
    @param {String} name
    @param {Object} clientNames
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#validateName}
*/
function validateName(name, clientNames, socket) {
  name = safeSanitize(name);
  if (name) {
    socket.emit(
      'validateNameResponse',
      !Object.values(clientNames).includes(name)
    );
  } else {
    socket.emit('validateNameResponse', false);
  }
}
/**
    @name getClientList
    @param {Array} clients
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getClientList}
*/
function getClientList(clients, socket) {
  const cloneArray = clients.slice();
  const i = clients.indexOf(getSocketID(socket));
  removeArrayElem(cloneArray, i);
  socket.emit('updateClientList', cloneArray);
}
/**
    @name handleDisconnect
    @param {Array} clients
    @param {Object} clientNames
    @param {Object} subscriptions
    @param {Array} rooms
    @param {Object} socket
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleDisconnect}
*/
function handleDisconnect(
  clients,
  clientNames,
  subscriptions,
  rooms,
  socket,
  io,
  syncInfo
) {
  const id = getSocketID(socket);
  // console.log('a user has disconnected:' + id);
  const i = clients.indexOf(id);
  if (!(i === -1)) {
    removeArrayElem(clients, i);
    delete clientNames[id];
    handleMemberCount(rooms, subscriptions, id);
    const activeRoom = subscriptions[id];
    delete subscriptions[id];
    if (activeRoom) {
      sendRoomAlert(
        io,
        activeRoom,
        'A user has just disconnected from ' + activeRoom + ' !'
      );
    }
    const ownershipI = searchRoom(rooms, 'owner', id);
    handleAutoRoomTransfer(ownershipI, subscriptions, rooms, io, syncInfo);
  }
}
/**
    @name handleConnection
    @param {Array} clients
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleConnection}
*/
function handleConnection(clients, socket) {
  const id = getSocketID(socket);
  // console.log('a user has joined:' + id);
  const i = clients.indexOf(id);
  if (i === -1) {
    clients.push(id);
  }
  /* else {
	       console.log('user exists:' + id)
	   }
	   console.log(array);*/
}
/**
    @name sendMessage
    @param {String} sender
    @param {Object} recipient
     @param {Object} msg
    @param {Object} io
    @param {Object} subscriptions
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendMessage}
*/
function sendMessage(sender, recipient, msg, io, subscriptions) {
  msg = safeSanitize(msg);
  if (recipient && recipient.id && msg) {
    if (recipient.type === 'user') {
      io.to(recipient.id).emit('newmsg', sender, msg, null);
    } else {
      // console.log('room chat');
      if (subscriptions[sender] === recipient.id) {
        io.to(recipient.id).emit('newmsg', recipient.id, msg, sender);
      }
    }
    // console.log(sender, recipient, msg);
  }
}
/**
    @name getClientNames
    @param {Object} clientNames
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getClientNames}
*/
function getClientNames(clientNames, socket) {
  socket.emit('updateClientNames', clientNames);
}
/**
    @name processRoom
    @param {Object} room
    @param {Array} rooms
    @param {Object} socket
    @param {Object} subscriptions
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#processRoom}
*/
function processRoom(room, rooms, socket, subscriptions) {
  const subClear = checkSub(subscriptions, socket, 'sendRoomResponse');
  const id = getSocketID(socket);
  if (subClear && room) {
    room.capacity = Number(room.capacity);
    const name = room.room_name;
    const description = room.description;
    const capacity = room.capacity;
    const password = room.password;
    const firstCondition =
      name && typeof name === 'string' && name.length < 51 && name.length > 0;
    const secondCondition =
      description &&
      typeof description === 'string' &&
      description.length < 51 &&
      description.length > 0;
    const thirdCondition =
      capacity && Number.isInteger(capacity) && capacity > 0 && capacity < 101;
    const fourthCondition = searchRoom(rooms, 'room_name', name) === -1;
    const fifthCondition =
      password && password.length > 0 && password.length < 51;
    if (
      firstCondition &&
      secondCondition &&
      thirdCondition &&
      fourthCondition
    ) {
      if (fifthCondition) {
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
        success: true,
      });
    } else {
      socket.emit('sendRoomResponse', {
        success: false,
        reason: 'many',
        first: firstCondition,
        second: secondCondition,
        third: thirdCondition,
        fourth: fourthCondition,
      });
    }
  }
}
/**
    @name getRooms
    @param {Array} rooms
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getRooms}
*/
function getRooms(rooms, socket) {
  const filteredRooms = [];
  rooms.forEach((item) => {
    filteredRooms.push({
      room_name: item.room_name,
      description: item.description,
      capacity: item.capacity,
      protected: item.protected,
      member_count: item.member_count,
      owner: item.owner,
    });
  });
  socket.emit('updateRooms', filteredRooms);
}
/**
    @name getSubscriptions
    @param {Object} subscriptions
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getSubscriptions}
*/
function getSubscriptions(subscriptions, socket) {
  socket.emit('updateSubs', subscriptions);
}
/**
    @name joinRoom
    @param {Object} form
    @param {Object} socket
    @param {Array} rooms
    @param {Object} subscriptions
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#joinRoom}
*/
function joinRoom(form, socket, rooms, subscriptions, io) {
  const id = getSocketID(socket);
  const subClear = checkSub(subscriptions, socket, 'joinRoomResponse');
  const roomName = form.room;
  const roomPw = form.pw;
  let scs = true;
  let rs = '';
  if (subClear && form) {
    const roomI = searchRoom(rooms, 'room_name', roomName);
    if (!(roomI === -1)) {
      const curRoom = rooms[roomI];
      if (curRoom.member_count === curRoom.capacity) {
        scs = false;
        rs = 'room full';
      } else {
        if (curRoom.protected && !(roomPw === curRoom.password)) {
          scs = false;
          rs = 'invalid password';
        } else {
          sendRoomAlert(
            io,
            roomName,
            'A user has just joined the ' + roomName + ' !'
          );
          rooms[roomI].member_count++;
          subscriptions[id] = roomName;
          socket.join(roomName);
        }
      }
    } else {
      scs = false;
      rs = 'room not found';
    }
  } else {
    scs = false;
    rs = 'invalid room';
  }
  genericRoomResponse('joinRoomResponse', scs, rs, socket);
}
/**
    @name genericRoomResponse
    @param {String} response
    @param {Boolean} success
    @param {String} reason
    @param {Object} socket
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#genericRoomResponse}
*/
function genericRoomResponse(response, success, reason, socket) {
  socket.emit(response, {
    success: success,
    reason: reason,
  });
}
/**
    @name checkSub
    @param {Object} subscriptions
    @param {Object} socket
    @param {String} sockmsg
    @return {Boolean}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#checkSub}
*/
function checkSub(subscriptions, socket, sockmsg) {
  if (subscriptions[getSocketID(socket)]) {
    socket.emit(sockmsg, {
      success: false,
      reason: 'subscribed',
    });
    return false;
  }
  return true;
}
/**
    @name searchRoom
    @param {Array} rooms
    @param {Object} compare
    @param {Object} to
    @return {Number}
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#searchRoom}
*/
function searchRoom(rooms, compare, to) {
  const roomI = rooms.findIndex(function (rm, index) {
    if (rm[compare] === to) {
      return true;
    }
  });
  return roomI;
}
/**
    @name handleRoomAction
    @param {Object} form
    @param {Object} socket
    @param {Array} rooms
    @param {Object} subscriptions
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleRoomAction}
*/
function handleRoomAction(form, socket, rooms, subscriptions, io, syncInfo) {
  // console.log(io.sockets.connected);
  let scs = true;
  let rs = '';
  if (form) {
    const id = getSocketID(socket);
    const subscription = subscriptions[id];
    if (subscription) {
      const roomI = searchRoom(rooms, 'room_name', subscription);
      const ownershipI = searchRoom(rooms, 'owner', id);
      if (roomI > -1) {
        const roomName = rooms[roomI].room_name;
        if (form.action === 'leave_room') {
          handleMemberCount(rooms, subscriptions, id);
          delete subscriptions[id];
          handleAutoRoomTransfer(
            ownershipI,
            subscriptions,
            rooms,
            io,
            syncInfo
          );
          socket.leave(roomName);
          sendRoomAlert(
            io,
            roomName,
            'A user has just left the ' + roomName + ' !'
          );
        } else if (ownershipI > -1) {
          const targetExists = form.target && form.target.length > 0;
          switch (form.action) {
            case 'disband_room':
              disbandRoom(rooms, subscriptions, roomI, io, syncInfo);
              break;
            case 'owner_transfer':
              if (targetExists) {
                transferOwner(rooms, form.target, roomI, io);
              } else {
                scs = false;
                rs = 'could not found target';
              }
              break;
            case 'kick_user':
              if (targetExists) {
                handleMemberCount(rooms, subscriptions, form.target);
                kickUser(subscriptions, form.target, io);
              } else {
                scs = false;
                rs = 'could not found target';
              }
              break;
            default:
              scs = false;
              rs = 'invalid action';
              break;
          }
        } else {
          scs = false;
          rs = 'not owner';
        }
      } else {
        scs = false;
        rs = 'room not found';
      }
    } else {
      scs = false;
      rs = 'not subscribed';
    }
  } else {
    scs = false;
    rs = 'invalid action';
  }
  genericRoomResponse('room_action_response', scs, rs, socket);
}
/**
    @name disbandRoom
    @param {Array} rooms
    @param {Object} subscriptions
    @param {String} target
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#disbandRoom}
*/
function disbandRoom(rooms, subscriptions, target, io, syncInfo) {
  const roomName = rooms[target].room_name;
  sendRoomAlert(io, rooms[target].room_name, roomName + ' has been disbanded!');
  clearRoom(rooms[target].room_name, '/', io);
  let firstSub = getKeyByValue(subscriptions, roomName);
  while (firstSub) {
    delete subscriptions[firstSub];
    firstSub = getKeyByValue(subscriptions, roomName);
  }
  removeArrayElem(rooms, target);
  delete syncInfo[roomName];
}
/**
    @name transferOwner
    @param {Array} rooms
    @param {String} target
    @param {Number} roomI
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#transferOwner}
*/
function transferOwner(rooms, target, roomI, io) {
  rooms[roomI].owner = target;
  sendRoomAlert(
    io,
    target,
    'Ownership of ' + rooms[roomI].room_name + ' has been transferred to you!'
  );
}
/**
    @name kickUser
    @param {Object} subscriptions
    @param {String} target
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#kickUser}
*/
function kickUser(subscriptions, target, io) {
  const roomName = subscriptions[target];
  delete subscriptions[target];
  const socket = io.sockets.connected[target];
  socket.leave(roomName);
  sendRoomAlert(io, target, 'You have been kicked from ' + roomName + ' !');
}
/**
    @name handleAutoRoomTransfer
    @param {Number} rI
    @param {Object} subscriptions
    @param {Array} rooms
    @param {Object} io
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleAutoRoomTransfer}
*/
function handleAutoRoomTransfer(rI, subscriptions, rooms, io, syncInfo) {
  if (!(rI === -1)) {
    const roomName = rooms[rI].room_name;
    const firstSub = getKeyByValue(subscriptions, roomName);
    if (firstSub) {
      rooms[rI].owner = firstSub;
      sendRoomAlert(
        io,
        firstSub,
        'Ownership of ' +
          roomName +
          ' has been transferred to you due to owners disconnection!'
      );
    } else {
      removeArrayElem(rooms, rI);
      delete syncInfo[roomName];
    }
  }
}
/**
    @name handleMemberCount
    @param {Array} rooms
    @param {Object} subscriptions
    @param {String} id
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleMemberCount}
*/
function handleMemberCount(rooms, subscriptions, id) {
  const curRoom = searchRoom(rooms, 'room_name', subscriptions[id]);
  // console.log(cur_room);
  if (!(curRoom === -1)) {
    rooms[curRoom].member_count--;
  }
}
/**
    @name sendRoomAlert
    @param {Object} io
    @param {String} target
    @param {String} msg
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#sendRoomAlert}
*/
function sendRoomAlert(io, target, msg) {
  msg = safeSanitize(msg);
  if (msg) {
    io.to(target).emit('roomalert', {
      message: msg,
    });
  }
}
/**
    @name clearRoom
    @param {String} room
    @param {String} namespace
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#clearRoom}
*/
function clearRoom(room, namespace = '/', io) {
  const roomObj = io.nsps[namespace].adapter.rooms[room];
  if (roomObj) {
    // now kick everyone out of this room
    Object.keys(roomObj.sockets).forEach(function (id) {
      io.sockets.connected[id].leave(room);
    });
  }
}
/**
    @name getSyncInfo
    @param {String} roomName
    @param {Object} socket
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#getSyncInfo}
*/
function getSyncInfo(roomName, socket, syncInfo) {
  // console.log(syncInfo[obj].player1);
  roomName = safeSanitize(roomName);
  if (roomName) {
    socket.emit('synchronizePlayers', syncInfo[roomName]);
  }
}
/**
    @name setSyncInfo
    @param {Object} playerInfo
    @param {Object} syncInfo
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#setSyncInfo}
*/
function setSyncInfo(playerInfo, syncInfo) {
  if (
    playerInfo &&
    playerInfo.player_states &&
    Object.keys(playerInfo.player_states).length > 0
  ) {
    syncInfo[playerInfo.room_name] = playerInfo.player_states;
  }
}
/**
    @name handleInvitation
    @param {Object} invitation
    @param {Object} socket
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#handleInvitation}
*/
function handleInvitation(invitation, socket, io) {
  // console.log(obj.invited);
  const target = safeSanitize(invitation.target);
  if (target) {
    io.to(invitation.invited).emit('invitation', {
      from: getSocketID(socket),
      toRoom: target,
    });
  }
}
/**
    @name acceptInvitation
    @param {String} roomName
    @param {Object} socket
    @param {Array} rooms
    @param {Object} subscriptions
    @param {Object} io
    @author Altug Ceylan <altug.ceylan.yes@gmail.com>
    @see {@link https://github.com/AranNomante/Ch-to/wiki/Doc#acceptInvitation}
*/
function acceptInvitation(roomName, socket, rooms, subscriptions, io) {
  let scs = true;
  let rs = '';
  if (roomName) {
    const subClear = checkSub(subscriptions, socket, 'joinRoomResponse');
    const roomI = searchRoom(rooms, 'room_name', roomName);
    const id = getSocketID(socket);
    if (subClear && !(roomI === -1)) {
      const curRoom = rooms[roomI];
      if (curRoom.member_count === curRoom.capacity) {
        scs = false;
        rs = 'Room capacity reached!';
      } else {
        sendRoomAlert(
          io,
          roomName,
          'A user has just joined the ' + roomName + ' !'
        );
        rooms[roomI].member_count++;
        subscriptions[id] = roomName;
        socket.join(roomName);
      }
    } else {
      scs = false;
      rs = 'Room does not exist!';
    }
  } else {
    scs = false;
    rs = 'invalid room';
  }
  genericRoomResponse('joinRoomResponse', scs, rs, socket);
}

module.exports = {
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
  joinRoom: joinRoom,
  handleRoomAction: handleRoomAction,
  setSyncInfo: setSyncInfo,
  getSyncInfo: getSyncInfo,
  handleInvitation: handleInvitation,
  acceptInvitation: acceptInvitation,
};
