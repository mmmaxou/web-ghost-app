let debug = require('debug')('web-scrapper:server')
var http = require('http')
var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var Ghost = require('./controllers/Ghost')
var inspect = require('eyes').inspector()
let jsonfile = require('jsonfile')

var index = require('./routes/index')
var download = require('./routes/download')
var downloadNull = require('./routes/download-null')
var voice = require('./routes/voice')
let wheels = require('./routes/wheels')
Ghost.init()

var port = normalizePort(process.env.PORT || '3000')
var app = express()
let context
jsonfile.readFile("./data/context.json", function (err, obj) {
  context = obj
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use('/tmp/', express.static(path.join(__dirname, 'tmp')))

// Apply custom fields to the req
app.use((err, req, res, next) => {
  req.ghost = Ghost
  req.context = context
  next(err)
})
app.set('port', port)

// Routes
app.use('/dl', download)
app.use('/dl-null', downloadNull)
app.use('/voice', voice)
app.use('/wheels', wheels)
app.use('/', index)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

/**
 * Listen on provided port, on all network interfaces.
 */


var server = http.createServer(app)
var io = require('socket.io')(server)
io.on('connection', function (socket) {
  var onevent = socket.onevent
  socket.onevent = function (packet) {
    var args = packet.data || []
    onevent.call(this, packet) // original call
    packet.data = ["*"].concat(args)
    onevent.call(this, packet) // additional call to catch-all
  }

  socket.on("*", function (event, data) {
    // For all events
    if (Ghost.commands[event]) {
      Ghost.commands[event](data)
    }
    inspect(event, "event")
    inspect(data, "data")
  })

  Ghost.setSocket(socket)
})

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port
  console.log('Listening on ' + bind)

}


server.listen(port)
server.on('error', onError)
server.on('listening', onListening)
