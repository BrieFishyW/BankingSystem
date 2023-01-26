var express = require('express');
var router = express.Router();

/* GET page. */
router.get('/', function(req, res, next) {
  console.log("loginuser.js: GET");
  res.render('loginuser', {});
});

/* POSt page. */
router.post('/', function(req, res, next) {
    console.log("loginuser.js: POST");
    res.render('loginpassword', {});
});

module.exports = router;