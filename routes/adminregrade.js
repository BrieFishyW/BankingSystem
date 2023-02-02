var express = require('express');
var router = express.Router();

/* GET regrade page. */
router.get('/', function(req, res, next) {
    console.log("adminregrade.js: GET");
  res.render('adminregrade', {});
});

module.exports = router;