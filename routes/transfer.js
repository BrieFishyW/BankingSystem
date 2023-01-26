var express = require('express');
var router = express.Router();

/* GET transfer page. */
router.get('/', function(req, res, next) {
    console.log("transfer.js: GET");
  res.render('transfer', {});
});

module.exports = router;