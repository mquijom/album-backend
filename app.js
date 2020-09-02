var express = require('express');
var path = require('path');
const cors = require('cors')
// "cookie-parser": "~1.4.4",
// var cookieParser = require('cookie-parser');

var app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use('/photos', express.static(`${__dirname}/albums`));
// app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" })
})

app.use('/photos', require('./routes/photos'));

module.exports = app;
