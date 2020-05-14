// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var dns = require('dns');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var urltools = require('url');

require('dotenv').config();
require('./database/connect');

const Url = require('./database/Url');

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({ optionSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));

const router = new express.Router();

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// Timestamps
router.get("/timestamp/:date_string?", function (req, res) {
  const dateString = req.params.date_string;
  const unix = Date.parse(dateString || new Date())
  const date = new Date(unix || Number(dateString));
  console.log(date);
  const response = unix || date.getTime() ? { utc: date.toUTCString(), unix: date.getTime() } : { error: 'Invalid Date' };
  res.json(response);
});

// Request header parser
router.get("/whoami", function (req, res) {
  const ipaddress = req.ip;
  const language = req.headers["accept-language"];
  const software = req.headers["user-agent"];
  res.json({ ipaddress, language, software });
});

// URL shortener
router.post("/shorturl/new", function (req, res) {
  const hostname = urltools.parse(req.body.url).hostname;
  if (!hostname) res.json({ error: 'invalid URL'});
  else {
    dns.lookup(hostname, (error) => {
      if (error) res.json({ error: 'invalid URL' });
      else {
        const url = req.body.url;
        const hash = shortid.generate();
        Url.create({ url, hash }, (err, data) => {
          if (err) res.json({ err });
          else res.json({ original_url: data.url, short_url: data.hash });
        });
      }
    });
  }
});

router.get("/shorturl/:hash", function (req, res) {
  Url.findOne({ hash: req.params.hash }, (err, data) => {
    res.redirect(data.url);
  });
});

// Not found middleware
router.use((req, res, next) => {
  return next({ status: 404, message: 'not found!' })
})

// Error Handling middleware
router.use((err, req, res, next) => {
  console.log("error handler");
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

app.use('/api', router);

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});