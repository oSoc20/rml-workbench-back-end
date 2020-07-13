const express = require('express');
const app = express();
const morgan = require('morgan');
const fs = require('fs');
const uniqid = require('uniqid');

app.use(morgan('dev'));

let routerV1 = express.Router();
app.use('/api/v1', routerV1);

routerV1.post('/create', null, (req, res) => {
  const token = uniqid();
  res.json({ token: token });
});

app.listen(8080, () => console.log('Started on port 8080'));
