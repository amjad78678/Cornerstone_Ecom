require('dotenv').config()
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

//--------------------------------------------------------------------------------------------------
const express = require('express');
const app = express();
const path = require('path')

const nocache = require('nocache')
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(nocache())

app.use((req, res, next) => {
  res.locals.session = req.session || {};
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use((req, res, next) => {
  console.log('Requested file path:', path.join(__dirname, req.url));
  next();
});
// app.use(express.static(path.join(__dirname, 'public')));  

const userRouter = require('./routes/userRoute');
app.use('/', userRouter);
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)

app.get('*', (req, res) => {
  res.render('404')
})



app.listen(port, () =>
  console.log(`port is running at http://localhost:${port}/  port is running at http://localhost:${port}/admin`),
);

// hello bruda endokkeya