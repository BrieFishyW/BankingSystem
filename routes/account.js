var express = require('express');
var router = express.Router();

/* GET account page. */
router.get('/', function(req, res, next) {
    console.log("account.js: GET");
  res.render('account', {});
});

module.exports = router;