var express = require('express');
var router = express.Router();
let path = require('path')
let zipFolder = require('zip-folder')
let fs = require('fs')
let del = require('delete')


/* dl website */
router.get('/', function (req, res, next) {
  console.log('Start Zipping');
  let folderPath = path.join(__dirname, '../tmp/test/')
  let zipfile = path.join(__dirname, '../tmp/website.zip')
  if (fs.existsSync(folderPath)) {

    zipFolder(folderPath, zipfile, function (err) {
      if (err) {
        console.log('oh no!', err);
      } else {
        console.log('Zip complete');
        console.log('Start download');
        res.download(zipfile, function (err) {
          if (err) {
            // Handle error, but keep in mind the response may be partially-sent
            // so check res.headersSent
          } else {
            // decrement a download credit, etc.
            res.end()
            del(zipfile)
            del(path.join(__dirname, '../tmp/test'))
          }
        })
      }
    });
  } else {
    res.redirect('/dl-null')
  }
});

module.exports = router;
