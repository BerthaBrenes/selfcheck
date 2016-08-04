
'use strict';

// Module dependencies
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var compression = require('compression');
var expressBrowserify = require('express-browserify');
var os = require('os');

module.exports = function(app) {
  // Configure Express
  app.set('view engine', 'jade');
  app.use(compression());
  app.use(cookieParser());
  if (app.get('env') === 'development') {
    // set up request logging for local development and non-bluemix servers
    // (bluemix's router automatically logs all requests there)
    app.use(morgan('dev'));
  }
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '40mb'
  }));
  app.use(bodyParser.json({
    limit: '40mb'
  }));

  // automatically bundle the front-end js on the fly
  // note: this should come before the express.static since bundle.js is in the public folder
  app.get('/js/bundle.js', expressBrowserify('./public/js/bundle.js', {
    watch: (app.get('env') === 'development')
  }));

  // Setup static public directory
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Setup the upload mechanism
  var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, os.tmpdir());
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  var upload = multer({
    storage: storage
  });
  app.upload = upload;

  // When running in Bluemix add rate-limitation
  // and some other features around security
  if (process.env.VCAP_APPLICATION) {
    require('./security')(app);
  }
};
