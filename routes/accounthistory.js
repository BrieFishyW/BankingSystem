var express = require('express');
var router = express.Router();

/* GET account history page. */
router.get('/', function(req, res, next) {
    console.log("accounthistory.js: GET");
  res.render('accounthistory', {});
});

module.exports = router;