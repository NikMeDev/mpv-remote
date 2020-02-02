var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var child = require('child_process');

function execOut(command, callback){
  child.exec(command, function(error, stdout, stderr){ callback(stdout); });
};

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use("/assets" , express.static('assets'));

io.on('connection', function(socket) {
  socket.on('next', function() {
    child.exec(
        `echo '{ "command": ["playlist-next"] }' | socat - /tmp/mpvsocket`)
  })
  socket.on('prev', function() {
    child.exec(
        `echo '{ "command": ["playlist-prev"] }' | socat - /tmp/mpvsocket`)
  })
  socket.on('pause', function() {
    child.exec(
        `echo '{ "command": ["cycle", "pause"] }' | socat - /tmp/mpvsocket`)
  })
  socket.on('skip-forward', function () {
    execOut(`echo '{ "command": ["get_property", "playback-time"] }' | socat - /tmp/mpvsocket`, (out) => {
      data = JSON.parse(out).data;
      child.exec(`echo '{ "command": ["set", "time-pos" , "${ Number(data) + 10 }"] }' | socat - /tmp/mpvsocket`)
    })
  })
  socket.on('skip-back', function () {
    execOut(`echo '{ "command": ["get_property", "playback-time"] }' | socat - /tmp/mpvsocket`, (out) => {
      data = JSON.parse(out).data;
      child.exec(`echo '{ "command": ["set", "time-pos" , "${ Number(data) - 10 }"] }' | socat - /tmp/mpvsocket`)
    })
  })
});

execOut(`echo '{ "command": ["get_property", "playback-time"] }' | socat - /tmp/mpvsocket`, (out) => {
  console.log(out);
})

http.listen(3000, function() {
  console.log('listening on *:3000');
});