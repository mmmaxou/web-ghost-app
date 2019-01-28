var socket = io()
var recognition
$(document).ready(function () {
  annyang = undefined

  if (annyang) {
    // Add our commands to annyang
    let commands = {
      'reload' () {
        window.location.reload()
      },
      'create (a) (simple) website' () {
        socket.emit('create a simple website')
      },
      'download' () {
        socket.emit('download')
      },
      'search on *website': {
        'regexp': /^search on (stackoverflow|stack overflow|google)/i,
        'callback' (website) {
          website = website.toLowerCase()
          socket.emit('search website', website)
          console.log(website);
        }
      },
      'search *query' (query) {
        socket.emit('search', query)
      },
      'next' () {
        Search.next()
      },
      'before' () {
        Search.before()
      },
      'open' () {
        $('#result .link').click()
      },
      'hide' () {
        Search.hide()
      },
      'help' () {
        $('#context').empty()
        for (key in commands) {
          if (commands.hasOwnProperty(key)) {
            $('#context').append(key + '\n')
          }
        }
        notification.play()
      },
      'homepage' () {
        window.location.href = "/"
      },
      'hello' () {
        display('Hi, have a nice day !')
      },
      'watch *query' (query) {
        socket.emit('watch', query)
      }

    }
    annyang.addCommands(commands);
    annyang.addCallback('resultNoMatch', function (userSaid) {
      console.log("Not found : ", userSaid); // sample output: 'hello'
    });

    // Tell KITT to use annyang
    SpeechKITT.annyang();

    // Define a stylesheet for KITT to use
    SpeechKITT.setStylesheet('//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/0.3.0/themes/flat.css');

    // Render KITT's interface
    SpeechKITT.vroom();
    annyang.start()
  }

  var colors = ['aqua', 'azure', 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral'];
  var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'

  recognition = new SpeechRecognition();
  var speechRecognitionList = new SpeechGrammarList();

  recognition.grammars = speechRecognitionList;
  //recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  speechRecognitionList.addFromString(grammar, 1);

  recognition.onresult = function (event) {
    var last = event.results.length - 1;
    var color = event.results[last][0].transcript;
    diagnostic.textContent = 'Result received: ' + color + '.';
    bg.style.backgroundColor = color;
    console.log('Confidence: ' + event.results[0][0].confidence);
  }

  recognition.onspeechend = function () {
    recognition.stop();
  }

  recognition.onnomatch = function (event) {
    diagnostic.textContent = 'I didnt recognise that color.';
  }

  recognition.onerror = function (event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
  }

  recognition.start()

  $('.debug-command').click(function (e) {
    let command = $(this).text().toLowerCase()
    annyang.trigger(command)
  })
})

socket.on('context', function (context) {
  let json = JSON.stringify(context, null, '\t')
  display(json, false)
  //  console.log(context);
  //  console.log(json);
  Prism.highlightElement($('#context')[0])
})

let Search = {
  results: null,
  currentPage: 0,
  type: null,
  TYPES: {
    SEARCH: 0,
    WATCH: 1
  },
  next() {
    this.currentPage++;
    this.currentPage = this.currentPage % (this.results.length)
    this.display()
  },
  before() {
    this.currentPage--;
    this.currentPage = this.currentPage % (this.results.length - 1)
    this.display()
  },
  display() {
    switch (this.type) {
      case this.TYPES.SEARCH:
        this.displaySearch();
        break;
      case this.TYPES.WATCH:
        this.displayWatch();
        break;
      default:
        console.log("I don't know what type to display")
        this.hide()
        break;
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
        .attr('data-voice', $("#result .link").text())
      Voice.addLink($("#result .link")[0], result.link)
      $('#result .pager').text((this.currentPage + 1) + "/" + this.results.length)
    } else {
      console.error("Can't display");
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
        .attr('data-voice', $("#watch .link").text())
      $('#watch .pager').text((this.currentPage + 1) + "/" + this.results.length)
    } else {
      console.error("Can't display");
    }
  },
  hide() {
    $('.result').hide()
  }
}
socket.on('result', function (result) {
  Search.results = result
  this.currentPage = 0
  Search.type = Search.TYPES.SEARCH
  Search.display()
})
socket.on('watch', function (result) {
  Search.results = result
  this.currentPage = 0
  Search.type = Search.TYPES.WATCH
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
  var src = document.createElement("source");
  src.src = "../sounds/bubbling-up.mp3";
  soundFile.appendChild(src);

  //Load the audio tag
  //It auto plays as a fallback
  soundFile.load();
  soundFile.volume = 1;

  return {
    play() {
      soundFile.currentTime = 0.01

      //Due to a bug in Firefox, the audio needs to be played after a delay
      setTimeout(() => {
        soundFile.play()
      }, 1);
    }
  }
}
var notification = new Notification()
