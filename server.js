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

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// Timestamps
app.get("/api/timestamp/:date_string?", function (req, res) {
  const dateString = req.params.date_string;
  const unix = Date.parse(dateString || new Date())
  const date = new Date(unix || Number(dateString));
  console.log(date);
  const response = unix || date.getTime() ? { utc: date.toUTCString(), unix: date.getTime() } : { error: 'Invalid Date' };
  res.json(response);
});

// Request header parser
app.get("/api/whoami", function (req, res) {
  const ipaddress = req.ip;
  const language = req.headers["accept-language"];
  const software = req.headers["user-agent"];
  res.json({ ipaddress, language, software });
});

// URL shortener
app.post("/api/shorturl/new", function (req, res) {
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

app.get("/api/shorturl/:hash", function (req, res) {
  Url.findOne({ hash: req.params.hash }, (err, data) => {
    res.redirect(data.url);
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});