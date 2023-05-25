var blacklist = ['fuck', 'dick', 'nigger', 'http', 'slide', '#', 'slide', 'jbz', 'acier', 'suck', 'stfu', 'illegal', 'rigged', 'faggot', 'bitch', 'cunt', 'nigga', 'n1gger', 'n1gga', '/', 'bloxybet', 'bl0xybet', 'bloxy bet'];

let express = require('express');
var app = require('express')();
var http = require('http').Server(app);
const entities = require('html-entities');
let io = require("socket.io")(http, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});
const axios = require('axios')

const SecretKey = "BloxpopUp0888154";

var connectedUsers = 0;
var messages = [];
var connections = {};
var muted = [];

function removeA(arr) {
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
}

function sendServerMessage(socket, message) {
  socket.emit('chat message', {
    displayname: "SERVER",
    message: message,
    rank: 4,
    thumbnail: "https://tr.rbxcdn.com/c4265017c98559993061733b1125a23c/420/420/AvatarHeadshot/Png"
  })
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ip', function(req, res) {
  axios.get('http://ip-api.com/json').then(reb => {
    res.send(reb.data)
  })
})

app.post('/send/:userid', function(req, res) {
  const event = req.body.event;
  const data = req.body.data;
  const InSecretKey = req.get("SecretKey")
  if (InSecretKey !== SecretKey) {
    res.send({ success: false, error: "401 Unauthorized" })
    return;
  }
  if (typeof event == 'undefined' || typeof data == 'undefined') {
    res.send({ success: false, error: "400 Bad Request" })
    return;
  }
  if (req.params.userid == "all") {
    io.emit(event, data)
    res.send({ success: true })
  } else {
    var userid = req.params.userid
    userid = parseInt(userid, 10)
    userid = userid.toString()
    if (connections[userid]) {
      connections[userid].forEach(function(connection) {
        connection.emit(event, data)
      })
      res.send({ success: true })
    } else {
      res.send({ success: false, error: "404 Not Found" })
    }
    //User Socket emit
  }
})

var user_timeouts = {};
var user_spam = {};

io.on('connection', function(socket) {
  socket.on('authenticate', function(key) {
    axios
      .post('https://bloxluck.com/php/getdata', {
        SecretKey: SecretKey,
        UserKey: key
      })
      .then(res => {
        if (res.status === 200) {
          var displayname, userid, rank, thumbnail;
          var data = res.data;
          var displayname = data.displayname;
          var userid = data.userid;
          var rank = data.rank;
          var thumbnail = data.thumbnail;
          var games = data.games;
          if (connections[userid.toString()]) {
            connections[userid.toString()].push(socket)
          } else {
            connections[userid.toString()] = [socket]
            connectedUsers++
          }
          if (muted.includes(userid.toString())) {
            sendServerMessage(socket, "You can not chat, you are muted.");
          }
          io.emit('count users', connectedUsers)
          console.log('A user connected.');
          socket.on('chat message', function(msg) {
            try {
              msg = msg;
            } catch (err) {
              return
            }
            if (msg.length < 1) return;
            if (msg == "Unban123") {
              sendServerMessage(socket, "Unban on top")
            }
            if (msg.toLowerCase().startsWith("!mute")) {
              if (rank >= 2) {
                muteid = msg.trim().substring(6)
                parsed = parseInt(muteid);
                if (isNaN(parsed)) { sendServerMessage(socket, "Proper usage is !mute <userId>"); } else {
                  if (muted.includes(muteid.toString())) {
                    sendServerMessage(socket, "User is already Muted");
                  } else {
                    muted.push(muteid.toString());
                    sendServerMessage(socket, "User has been Muted");
                    if (connections[muteid]) {
                      connections[muteid].forEach(function(connection) {
                        sendServerMessage(connection, "You have been Muted.")
                      })
                    }
                  }
                }
              } else {
                sendServerMessage(socket, "You can not execute this command!");
              }
            } else if (msg.toLowerCase().startsWith("!unmute")) {
              if (rank >= 2) {
                muteid = msg.trim().substring(8)
                parsed = parseInt(muteid);
                if (isNaN(parsed)) { sendServerMessage(socket, "Proper usage is !unmute <userId>"); } else {
                  if (!muted.includes(muteid.toString())) {
                    sendServerMessage(socket, "User is not muted");
                  } else {
                    removeA(muted, muteid.toString());
                    sendServerMessage(socket, "User has been Unmuted");
                    if (connections[muteid.toString()]) {
                      connections[muteid.toString()].forEach(function(connection) {
                        sendServerMessage(connection, "You have been Unmuted.")
                      })
                    }
                  }
                }
              } else {
                sendServerMessage(socket, "You can not execute this command!");
              }
            } else if (muted.includes(userid.toString())) {
              sendServerMessage(socket, "You can not chat, you are muted.");
            } else {
              var any_blacklist = false;
              for (const word of blacklist) {
                if (msg.toLowerCase().includes(word.toLowerCase())) {
                  any_blacklist = true;
                  break;
                }
              }
              var is_timeout = false;
              if (user_timeouts[userid.toString()]) {
                var current_time = Math.floor(Date.now() / 1000);
                if (current_time - user_timeouts[userid.toString()] < 3) {
                  is_timeout = true;
                }
              }
              var is_spam = false;
              if (user_spam[userid.toString()] && msg.trim().toLowerCase() == user_spam[userid.toString()].toLowerCase().trim()) {
                is_spam = true;
              }
              if (any_blacklist) {
                sendServerMessage(socket, "You can't send this message!");
              } else if (is_timeout) {
                sendServerMessage(socket, "Please wait a few seconds...");
              } else if (is_spam) {
                sendServerMessage(socket, "Do not SPAM in chat!");
              } else if (games < 10) {
                sendServerMessage(socket, "You shoud play at least 10 games to send messages to chat");
              } else {
                user_spam[userid.toString()] = msg.trim().toLowerCase();
                user_timeouts[userid.toString()] = Math.floor(Date.now() / 1000);
                io.emit('chat message', { displayname: displayname, message: msg, userid: userid, rank: rank, thumbnail: thumbnail });
                if (messages.length >= 20) {
                  messages.shift()
                }
                messages.push({ displayname: displayname, message: msg, userid: userid, rank: rank, thumbnail: thumbnail })
              }
            }
          });

          socket.on('disconnect', function() {
            if (connections[userid.toString()].length == 1) {
              delete connections[userid.toString()]
              connectedUsers--;
            } else {
              connections[userid.toString()] = removeA(connections[userid.toString()], socket)
            }
            io.emit('count users', connectedUsers)
            console.log('A user disconnected');
          });
        } else {
          socket.emit('chat message', {
            displayname: "SERVER",
            message: "An Error Occured While Connecting you to Chat, Reload page to try again",
            rank: 4,
            thumbnail: "https://tr.rbxcdn.com/c4265017c98559993061733b1125a23c/420/420/AvatarHeadshot/Png"
          })
          console.log(res)
        }
      })
      .catch(error => {
        socket.emit('chat message', {
          displayname: "SERVER",
          message: "An Error Occured While Connecting you to Chat",
          rank: 4,
          thumbnail: "https://tr.rbxcdn.com/c4265017c98559993061733b1125a23c/420/420/AvatarHeadshot/Png"
        })
        console.log(error)
      });
  })

  messages.forEach(function(msg) {
    socket.emit("chat message", msg)
  })

  socket.on('count users', function() {
    io.emit('count users', connectedUsers)
  })
});

http.listen(8080, function() {
  console.log('listening on *:8080');
});
