var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var users = ['nasir', 'mitu', 'honor'];
var u_i = {nasir:0, mitu:1, honor:2, admin:3}
var u_m = [{nasir:{active:false,class:'2A',child:'Nati',type:0}},
           {mitu:{active:false, class:'2A',child:'Adey',type:0}},
            {honor:{active:false, class:'2A',type:1}},{admin:{type:2}}
            ];//subjects
var u_p = {'nasir':'123', 'mitu':'234','honor':'123','admin':'admin'};
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

app.get('/logout', (req, res) => {
  try{  
      //console.log(req);
      var d = req.headers.authorization;  
      console.log(d);
      if(!d) res.status(401).end("Error"); 
      var data = new Buffer(d.split(' ')[1], 'base64').toString();
      var pair = data.split(':');
      var username = pair[0];
      var password = pair[1];
      console.log(username+password);
      if(users.includes(username) && u_p[username]===password){
        res.send({token:'sdkfj3920j30999032kjlk','meta':{
            type:1,
            users:users, username:username, class:'2A'    
        }});
      }else res.status(401).end(null);
  }catch(e){console.log(e);}

});

var usmap = new Map();

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  console.log('a socket'+socket.username+'connected');
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {

    // we tell the client to execute 'new message'
    console.log('new message :'+data + " from " + socket.username);
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

   socket.on('remove user', function (username) { 

   });

   socket.on('pmessage', function (message,to) {
    console.log('new message :'+message + " from " + socket.username+' to '+to);
    usmap.get(to).emit('pmessage',{
        username:'mitu',
        message:message
    })
    //socket.broadcast.emit('pmessage', {
      //username: socket.username,
      //message: data
    //});
   });
   socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

   socket.on('logout',function(username){
     u_m[u_i[username]].active = false;
     console.log(username + ' logged out');
   });
    


  // when the client emits 'add user', this listens and executes
  socket.on('login', function (username) {
    if (addedUser) return;
    console.log('added '+username);
    usmap.set(username,socket);
    u_m[u_i[username]].active = true;
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
     socket.broadcast.emit('user joined', {
       username:username,  
       numUsers: numUsers
     });
    // echo globally (all clients) that a person has connected
    
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
