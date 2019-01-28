let Scrapper = require('./Scrapper')
let Brain = require('./Brain')
let mkdir = require('mkdirp')
let path = require('path')
let copydir = require('copy-dir')
let opn = require('opn')
let fs = require('fs')
let jsonfile = require('jsonfile')
let Context = require('../helpers/Context')
let inspect = require('eyes').inspector({
  maxLength: Infinity
})

function Ghost() {
  let self = {}

  self.init = function () {
    //    self.createWebsite()
    //    self.watch("ghost in the shell")
    Context.setItem('research', null)
    Brain.init()
    self.watch('Ghost in the shell stand alone complex season 1 episode 3')


  }
  self.commands = {
    'create a simple website' () {
      self.createSimpleWebsite()
    },
    'download' () {
      self.downloadWebsite()
    },
    'scrape' () {
      Scrapper.scrapeEDT()
    },
    'search website' (website) {
      Context.setItem('search website', website)
    },
    'search': (query) => {
      self.search(query)
    },
    'watch': (query) => {
      self.watch(query)
    }
  }
  self.say = function (o) {
    console.log('>_ ' + o)
  }
  self.createSimpleWebsite = function () {

    self.say("Let's create a website")
    let website = {
      name: 'test',
    }
    website.dir = path.join(__dirname, '../tmp/', website.name)

    Context.setItem('website', website)

    /// If the website already exist, open it
    if (fs.existsSync(website.dir)) {
      console.log("Already exist");
      opn('http://localhost:3000/tmp/test/dist/')

    } else {
      /// Create the temporary website
      console.log("Creation");
      mkdir(website.dir, () => {})
      let templatePath = path.join(__dirname, '../../templates/')
      copydir(templatePath + 'webapp', website.dir + '/', function (err) {
        if (err) console.log(err);
        opn('http://localhost:3000/tmp/test/dist/')
        website.existing = true
        Context.setItem('website', website)
      });
    }



  }
  self.downloadWebsite = function () {
    opn('http://localhost:3000/dl')
    Context.setItem('website', null)
  }
  self.search = function (query) {
    self.say("I want to search " + query)
    Context.setItem('research', {
      state: 'fetching',
      query: query
    })
    Scrapper.searchStackoverflow(query, function (answer) {
      Context.setItem('research', {
        state: 'done',
        query: query
      })
      self.socket.emit('result', answer)
    })
  }
  self.watch = async function (query) {
    query += " streaming vostfr"
    self.say("I want to watch " + query)
    Context.setItem('research', {
      state: 'fetching',
      query: query
    })

    let answer = await Scrapper.watchSomething(query)
    Context.setItem('research', {
      state: 'done',
      query: query
    })
    self.socket.emit('watch', answer)

  }
  self.setSocket = function (socket) {
    self.socket = socket
    Context.setSocket(socket)
  }

  return self
}


module.exports = new Ghost()
