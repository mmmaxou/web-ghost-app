let cheerio = require('cheerio')
let _ = require('lodash')
let google = require('google')
let request = require('request')
let rp = require('request-promise-native')
let inspect = require('eyes').inspector({
  maxLength: Infinity
})


function Scrapper() {
  let self = {}

  self.searchStackoverflow = function (q, cb) {
    let tags = 'javascript'
    let url = `https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&q=${q}&closed=True&tagged=${tags}&site=stackoverflow`
    let param = {
      method: 'GET',
      uri: url,
      gzip: true
    }

    request(param, function (err, res, body) {
      if (err) {
        console.log('Couldn’ t get page because of error: ' + err);
        return;
      }

      /// Gather all the links and display to console
      let resultsLinks = []
      JSON.parse(body).items.forEach(function (ans) {
        resultsLinks.push({
          title: ans.title,
          link: ans.link
        })
      })
      inspect(resultsLinks, 'resultsLinks')

      promises = []
      resultsLinks.forEach(function (result) {
        let p = new Promise(function (resolve, reject) {
          request(result.link, function (err, res, body) {
            if (err) {
              reject(err)
            }

            let page = {}
            $ = cheerio.load(body)
            page.title = $('#question-header h1 a').text()
            page.question = $('#question .post-text').text()
            page.answer = $('#answers .answer').first().find('.post-text').text()
            page.link = result.link

            inspect(page, 'page')
            resolve(page)
          })
        })
        promises.push(p)
      })
      Promise.all(promises)
        .then(function (res) {
          inspect(res, 'res')
          cb(res)
        })
        .catch(function (err) {
          console.error(err);
        })
    })
  }
  self.watchSomething = function (query) {
    return new Promise(function (resolve, reject) {

      /// Create the url
      let url = `https://www.google.fr/search?q=` + query.replace(/ /gi, '+');
      let param = {
        method: 'GET',
        uri: url,
        gzip: true
      }

      /// Do the request
      request(param, function (err, res, body) {

        /// Error Handling
        err ? reject(err) : undefined;

        /// Gather all the links and display to console
        let links = []
        $ = cheerio.load(body)
        $('#ires h3 > a').each(function (i, elem) {
          let l = $(this).attr('href')
          l = l.replace('/url?q=', '')
          l = l.substr(0, l.indexOf('&'))
          links.push({
            title: $(this).text(),
            link: l,
            iframe: undefined,
            vide: undefined
          })
        })
        inspect(links, 'Links')

        /// Now let's search on each page
        let promises = []
        links.forEach((elt) => {
          let p = new Promise(function (resolve, reject) {
              var opts = {
                maxRedirects: '2',
                followRedirect: true,
                uri: elt.link,
                timeout: 10000
              }
              request(opts, function (err, res, body) {
                if (err) {
                  console.log('Link No access')
                  resolve()
                  return
                }
                $ = cheerio.load(body)
                let $iframe = $('iframe').attr('src')
                if ($iframe)
                  elt.iframe = $iframe
                let $video = $('video')
                console.log($video.attr('id'))
                let title = $('span#eow-title').text()
                console.log('The title of the video %s is %s', elt.link, title)
                if ($video) {
                  let $videoHTML = $.html($video)
                  //elt.video = $video
                }
                resolve()
              })
            })
            .then(() => {})
            .catch(err => {})
          promises.push(p)
        })


        Promise.all(promises)
          .then(function () {
            links = links.filter((elt) => {
              elt.iframe || elt.video
            })
            inspect(links, 'Links')
            resolve(links)
          })
          .catch(function (err) {
            console.error('Promise ERROR:', err);
          })

      })
    })
  }

  return self
}

module.exports = new Scrapper()
