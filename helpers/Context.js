let jsonfile = require('jsonfile')
let path = require('path')


let helper = {}
helper.save = function (context, display = true, callback) {
  jsonfile.writeFile(path.join(__dirname, '../data/context.json'), context, {
      spaces: 2
    },
    function (err) {
      if (err) throw err
      if (helper.socket && display) {
        helper.get(function (context) {
          helper.socket.emit('context', context)
        })
      }
      if (callback)
        callback(context)
    })
}
helper.setItem = function (field, data, display = true) {
  helper.get(function (context) {
    context[field] = data
    helper.save(context, display)
  })
}
helper.get = function (callback) {
  jsonfile.readFile(path.join(__dirname, '../data/context.json'), function (err, obj) {
    if (err) throw err
    callback(obj)
  })
}
helper.setSocket = function (socket) {
  helper.socket = socket
  helper.get(function (context) {
    helper.socket.emit('context', context)
  })
}
helper.deleteItem = function (field, callback) {
  helper.get(function (context) {
    let newContext = {}
    for (prop in context) {
      if (context.hasOwnProperty(prop)) {
        if (prop != field) {
          newContext[prop] = context[prop]
        }
      }
    }
    helper.save(newContext, false, callback)
  })
}

module.exports = helper
