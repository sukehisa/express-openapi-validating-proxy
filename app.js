const express = require('express');
const path = require('path');
const http = require('http');
var request = require('request');
const proxy = require('express-http-proxy');
const { parser } = require('stream-json');

const axios = require('axios');
const { PassThrough } = require('stream');

const OpenApiValidator = require('express-openapi-validator');

const port = 3000;
const app = express();
const apiSpec = path.join(__dirname, 'api.yaml');

// 1. Install bodyParsers for the request types your API will support
app.use(express.urlencoded({ extended: false }));
app.use(express.text());
app.use(express.json());

// Optionally serve the API spec
app.use('/spec', express.static(apiSpec));


app.use('/', function(req, res, next) {
  console.log("accessed to " + req.url);
  console.log("query params:");
  console.log(req.query);
  console.log("request body:");
  console.log(req.body);
  next();
})

//  2. Install the OpenApiValidator on your express app
app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateResponses: true, // default false
  }),
);


// 3. proxy to API to check
app.use('/', async (req, res, next) => {
  try {
    const url = 'http://localhost:3030' + req.originalUrl;

    // パイプ用のストリームを作成
    //const passThrough = new PassThrough();

    // クライアントからのリクエストをプロキシにパイプ
    //req.pipe(passThrough);

    // プロキシリクエストを作成
    const proxyResponse = await axios({
      method: req.method,
      url,
      //params: req.query,
      //data: passThrough, // パイプしたストリームをデータとして渡す
      data: req.body,
      responseType: 'json', // ストリーム形式のレスポンスを取得
      headers: {
        'Content-Type': req.get('Content-Type'),
      },
    });

    console.log("response body:");
    console.log(proxyResponse.data);

    // プロキシのレスポンスをクライアントにパイプ
    res.set("Content-Type", "application/json");
    res.status(200).json(proxyResponse.data);
  } catch (error) {
    console.error('Proxy request error:', error.message);
    
    if (error.response) {
      console.log("it's error response");
      console.log(error.response.status);
      console.log(error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).send('Internal Server Error');
    }
  } finally {
    next();
  }
});

// 4. Create a custom error handler
app.use((err, req, res, next) => {
  console.log("error handler!!");
  // format errors
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});



http.createServer(app).listen(port);
console.log(`Listening on port ${port}`);

module.exports = app;
