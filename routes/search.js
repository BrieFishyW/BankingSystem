var express = require('express');
var router = express.Router();

/* GET page. */
router.get('/', function(req, res, next) {
  console.log("search.js: GET");
  res.render('search', {});
});

module.exports = router;