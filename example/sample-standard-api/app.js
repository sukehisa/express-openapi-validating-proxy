const express = require('express');
const http = require('http');
const { Pets } = require('./services');


const port = 3030;
const app = express();


// 1. Install bodyParsers for the request types your API will support
app.use(express.urlencoded({ extended: false }));
app.use(express.text());
app.use(express.json());

const pets = new Pets();

app.use('/', function (req, res, next) {
  console.log("accessed to " + req.url);
  console.log(req.query);
  console.log(req.body);
  next();
})

// 3. Add routes
app.get('/v1/ping', function (req, res, next) {
  res.send('pong');
});

app.get('/v1/hello', function (req, res, next) {
  res.json({'message': "123"});
});

app.get('/v1/pets', function (req, res, next) {
  res.json(pets.findAll(req.query));
});

app.post('/v1/pets', function (req, res, next) {
  res.json(pets.create({ ...req.body }));
});

app.delete('/v1/pets/:id', function (req, res, next) {
  res.json(pets.delete(req.params.id));
});

app.get('/v1/pets/:id', function (req, res, next) {
  const pet = pets.findById(req.params.id);
  return pet
    ? res.json(pet)
    : res.status(404).json({ code: 111, message: 'not found' });
});

// 3a. Add a route upload file(s)
app.post('/v1/pets/:id/photos', function (req, res, next) {
  // DO something with the file
  // files are found in req.files
  // non file multipar params are in req.body['my-param']
  console.log(req.files);

  res.json({
    files_metadata: req.files.map((f) => ({
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      // Buffer of file conents
      // buffer: f.buffer,
    })),
  });
});


http.createServer(app).listen(port);
console.log(`Listening on port ${port}`);

module.exports = app;
