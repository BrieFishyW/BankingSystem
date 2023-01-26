var express = require('express');
var router = express.Router();

/* GET page. */
router.get('/', function(req, res, next) {
    console.log("results.js: GET");
    res.render('results', {});
  });

/* POST page. */
router.post('/', function(req, res, next) {
    console.log("results.js: POST");
    //let education = req.body.education;

    res.render('results', {});
});

module.exports = router;