const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require("cors");
var session = require('express-session');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000','https://bejewelled-rugelach-940512.netlify.app'],
    // origin: "*",
    credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(session(
    { 
        secret: "pizzaspaghetti", 
        cookie: { maxAge: 60000 }, 
        resave: false,
        saveUninitialized: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require("./mongo");
var userRouter = require('./routes/userRoute');
var mapRouter = require('./routes/mapRoute');
var communityRouter = require('./routes/communityRoute');
connectDB();
app.use('/user', userRouter);
app.use('/map', mapRouter);
app.use('/community', communityRouter);

module.exports = app;