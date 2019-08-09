/* sample files here - feel free to use your own setup/generator */
const express = require('express')
require('dotenv').config()
var path = require('path');
const https = require('https');
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
const port = process.env.PORT;

// access api key, ignored in git by default so you'll need to add your own to run locally
const apiKey = process.env.apiKey;

// JSON object used to look up lat and lng by zip code. Considered using an API to convert, but figured for the given task this might be better
const zipJson = require('./zips.js').zipJson;
var error = false;

// momemt js for easy date parsing
const moment = require('./moment.js');


// ======================================= FUNCTIONS =======================================
// returns lat and lng from zipJson file
const getPosition = (zip) => {
  return zipJson[zip];
}

// gets the forecast given a latitude and longitude input, returning a promise
const getForecast = (lat, lng) => {
  let output = '';
  let options = {
    host: 'api.darksky.net',
    path: `/forecast/${apiKey}/${lat.trim()},${lng.trim()}`
  };

  return new Promise((resolve, reject) => {
    https.get(options, response => {
      response.on('data', (chunk) => {
        output += chunk;
      });
      response.on('end', () => {
        let obj = JSON.parse(output);
        let summary = obj["daily"]["summary"]
        let data = obj["daily"]["data"]
        let forecasts = data.map(x => {
          // time had to be * 1000 for javascript date object
          return { id: x.time,
                  date: moment(x.time * 1000).format("MMM Do YYYY"),
                  summary: x.summary,
                  icon: getIcon(x.icon),
                  iconName: x.icon,
                  temperatureHigh: Math.round(x.temperatureHigh),
                  temperatureLow: Math.round(x.temperatureLow),
                  precipProbability: percent(x.precipProbability),
                  windSpeed: Math.round(x.windSpeed), humidity: percent(x.humidity)}
        });
        resolve(forecasts);
      });
    });
  });
}

// returns the function name for the dark sky icon package
const getIcon = (desc) => {
  let iconName = desc.replace(/-/g, "_")
  let snakeCase = ""
  for(let i=0; i<iconName.length; i++) {
    snakeCase += iconName[i].toUpperCase();
  }
  return snakeCase
}

// convert number to percent
const percent = (number) => {
  return Math.round(number * 100) + "%";
}


// ======================================= ROUTES =======================================
app.get('/', (req, res) => {
  res.render('pages/index', {forecasts: [], error: error, zip: null});
});

app.get('/forecast', (req, res) => {
  res.redirect('/');
});

app.post('/forecast', (req, res) => {
  error = false
  if(req.body.lat && req.body.lng) {
    var location = {lat: req.body.lat, lng: req.body.lng}
    var zip = "current location"
  }
  else {
    var zip = req.body.zipCode;
    var location = getPosition(zip);
    if(!location) {
      // add error and redirect if zip code doesn't exist
      error = true;
      res.redirect('/');
      return null;
    }
  }
  getForecast(location.lat, location.lng).then((forecasts) => {
    res.render('pages/index', {forecasts: forecasts, error: error, zip: zip});
  }).catch(reason => {
      error = true;
      console.log(reason);
  });
});

if(port) {
  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
