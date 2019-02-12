var socket = io()
let context
const commands = {
  'reload'() {
    window.location.reload()
  },
  'create (a) (simple) website'() {
    socket.emit('create a simple website')
  },
  'download'() {
    socket.emit('download')
  },
  'delete website'() {
    socket.emit('delete website')
  },
  'search on *website': {
    'regexp': /^search on (stackoverflow|stack overflow|google)/i,
    'callback'(website) {
      website = website.toLowerCase()
      socket.emit('search website', website)
    }
  },
  'search *query'(query) {
    socket.emit('search', query)
  },
  'next'() {
    Search.next()
  },
  'before'() {
    Search.before()
  },
  'open'() {
    $('#result .link').click()
  },
  'hide'() {
    Search.hide()
  },
  'help'() {
    $('#context').empty()
    for (key in commands) {
      if (commands.hasOwnProperty(key)) {
        $('#context').append(key + '\n')
      }
    }
    notification.play()
  },
  'homepage'() {
    window.location.href = "/"
  },
  'hello'() {
    display('Hi, have a nice day !')
  },
  'watch *query'(query) {
    socket.emit('watch', query)
  },
  'context'() {
    display(context)
    Prism.highlightElement($('#context')[0])
  },
  'again'() {
    if (typeof annyang.lastCommand == "string")
      annyang.trigger(annyang.lastCommand)
  }

}
$(document).ready(function () {

  let annyangWorking = true

  try {
    annyang.getSpeechRecognizer()
  } catch (exception) {
    console.warn('No Speech Recognition')
    annyangWorking = false
    annyang.addCommands(commands)
  }

  // Add our commands to annyang
  annyang.addCommands(commands)
  annyang.addCallback('resultNoMatch', function (userSaid) {
    display(`Unknown command ${userSaid}, try :'help'`)
  })
  annyang.addCallback('resultMatch', (userSaid, commandFound) => {
    annyang.lastCommand = userSaid
  })


  if (annyang) {
    // Tell KITT to use annyang
    SpeechKITT.annyang()

    SpeechKITT.setSampleCommands(commands)
    // Define a stylesheet for KITT to use
    const style = '//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/1.0.0/themes/flat-turquoise.css'
    SpeechKITT.setStylesheet(style);
    SpeechKITT.setInstructionsText('Say "help" to use voice recognition')

    // Render KITT's interface
    SpeechKITT.vroom()
    annyang.start()
  }

  $('.debug-command').click(function (e) {
    let command = $(this).text().toLowerCase()
    annyang.trigger(command)
  })
  const trigger = function (e) {
    let val = $('#dialog').val().toLowerCase()
    annyang.trigger(val)
  }

  $('#dialog').change(trigger)
  $('#dialog-enter').click(trigger)
})

socket.on('context', function (res) {
  let json = JSON.stringify(res, null, '\t')
  context = json
  display(context, false)
  Prism.highlightElement($('#context')[0])
})

const Search = {
  results: null,
  currentPage: 0,
  type: null,
  TYPE: {
    SEARCH: 0,
    WATCH: 1
  },
  next() {
    this.currentPage++
    this.currentPage = this.currentPage % (this.results.length)
    this.display()
  },
  before() {
    this.currentPage--
    this.currentPage = this.currentPage % (this.results.length - 1)
    this.display()
  },
  display() {
    switch (this.type) {
      case this.TYPE.SEARCH:
        this.displaySearch()
        break
      case this.TYPE.WATCH:
        this.displayWatch()
        break
      default:
        console.log("I don't know what type to display")
        this.hide()
        break
    }
  },
  displaySearch() {
    let result = this.results[this.currentPage]
    if (result) {
      $('#result').fadeIn()
      $('#result .title').html(result.title)
      $('#result .question').html(result.question)
      $('#result .answer').html(result.answer)
      $('#result .link')
        .attr('href', result.link)
      $('#result .pager').text((this.currentPage + 1) + "/" + this.results.length)
    } else {
      console.error("Can't display")
    }
    notification.play()
  },
  displayWatch() {
    let result = this.results[this.currentPage]
    if (result) {
      $('#watch').fadeIn()
      $('#watch iframe').attr('src', result.iframe)
      $('#watch .title').html(result.title)
      $('#watch .link')
        .attr('href', result.link)
      $('#watch .pager').text((this.currentPage + 1) + "/" + this.results.length)
    } else {
      console.error("Can't display")
    }
  },
  hide() {
    $('.result').hide()
  }
}
socket.on('result', function (result) {
  Search.results = result
  this.currentPage = 0
  Search.type = Search.TYPE.SEARCH
  Search.display()
})
socket.on('watch', function (result) {
  Search.results = result
  this.currentPage = 0
  Search.type = Search.TYPE.WATCH
  Search.display()
})

function display(text, sound = true) {
  $('#context').text(text)
  if (sound) notification.play()
}

/*
Notification Sound
*/
const Notification = function () {
  let soundFile
  soundFile = document.createElement('audio')
  soundFile.preload = 'auto'

  //Load the sound file (using a source element for expandability)
  var src = document.createElement("source")
  src.src = "../sounds/bubbling-up.mp3"
  soundFile.appendChild(src)

  //Load the audio tag
  //It auto plays as a fallback
  soundFile.load()
  soundFile.volume = 1

  return {
    play() {
      soundFile.currentTime = 0.01

      //Due to a bug in Firefox, the audio needs to be played after a delay
      setTimeout(() => {
        soundFile.play()
      }, 1)
    }
  }
}
var notification = new Notification()
