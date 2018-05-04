var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('voice', {
    title: 'Ghost',
    number: 0
  });
});

router.get('/:number', function (req, res, next) {
  var number = req.params.number
  res.render('voice', {
    title: 'Ghost',
    number: number
  });
});

module.exports = router;
