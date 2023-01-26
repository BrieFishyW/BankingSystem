var express = require('express');
var router = express.Router();

/* GET change password page. */
router.get('/', function(req, res, next) {
    console.log("changepassword.js: GET");
  res.render('changepassword', {});
});

module.exports = router;