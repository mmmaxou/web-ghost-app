var express = require('express');
var router = express.Router();

/* dl website */
router.get('/', function (req, res, next) {
  res.render('dl-null', {
    title: 'Ghost'
  });
});

module.exports = router;
