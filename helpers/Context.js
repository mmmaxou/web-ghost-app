let jsonfile = require('jsonfile')
let path = require('path')


let Context = {}
Context.save = (context, display = true) => {
  //console.trace()
  return new Promise((resolve, reject) => {
    jsonfile.writeFile(path.join(__dirname, '../data/context.json'), context, {
        spaces: 2
      },
      (err) => {
        if (err)
          reject(err)
        if (Context.socket && display) {
          Context.get()
            .then((context) => {
              Context.socket.emit('context', context)
            })
            .catch(err => {
              console.error(err)
              reject(err)
            })
        }
        resolve(context)
      })
  })
}
Context.setItem = (field, data, display = true) => {
  return new Promise((resolve, reject) => {
    Context.get()
      .then((context) => {
        context[field] = data
        Context.save(context, display)
          .then(() => {
            resolve(context[field])
          })
      })
      .catch(reject)
  })
}
Context.get = () => {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(path.join(__dirname, '../data/context.json'),
      (err, obj) => {
        if (err)
          reject(err)
        else
          resolve(obj)
      })
  })
}
Context.deleteItem = (field) => {
  return new Promise((resolve, reject) => {
    Context.get()
      .then((context) => {
        let newContext = {}
        for (prop in context) {
          if (context.hasOwnProperty(prop)) {
            if (prop != field) {
              newContext[prop] = context[prop]
            }
          }
        }
        Context.save(newContext, false)
        resolve(context[field])
      })
  })
}
Context.setSocket = (socket) => {
  Context.socket = socket
  Context.get()
    .then((context) => {
      Context.socket.emit('context', context)
    })
    .catch(err => {
      console.error(err)
      throw Error(err)
    })
}

module.exports = Context
