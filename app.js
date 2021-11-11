//jshint esversion:6
require("dotenv").config(); //npm to install this package and need to declare top most to this environment variable
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const _ = require("lodash");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");//npm to install this encryption package
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongo0se = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({//must place in this position
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
// mongoose.set("useCreateIndex", true);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String//to store google id for next login
});
// const secret = "Thisisourlittlesecret." //create encryptkey
// console.log(process.env.SECRET);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]}); //use plunin to encrypt userschema and define the field to be encrypted
userSchema.plugin(passportLocalMongo0se); //to use this plugin with mongoose schema
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
  // console.log(req);
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){//after login and with cookie enable, page will render to secreit page otherwise will redirect to login
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, result){
      if (err){
        console.log(err);
        res,redirect("/register");
      }
      else{
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
  });//from passport package

  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   const newUser = new User({
  //     email: req.body.username,
  //     // password: md5(req.body.password)
  //     password: hash
  //   });
  //
  //   newUser.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     }
  //     else{
  //       res.render("secrets"); //render to display that page while redirect is to send to get request of that route
  //       // console.log("add new record" + user);
  //     }
  //   });
  // });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){//password login function
    if(err){
      console.log(err);
    }
    else{
      // res.redirect("/secrets");
      passport.authenticate("local")(req, res, function(){//to save to cookie
        res.redirect("/secrets");
      });
    }
  });
  // const userEmail = req.body.username
  // const userPassword = req.body.password
  // // const userPassword = md5(req.body.password)
  // User.findOne({email: userEmail}, function(err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   }
  //   else {
  //     if (foundUser) {
  //       bcrypt.compare(userPassword, foundUser.password, function(err, result) {
  //         if(result === true){
  //           res.render("secrets");
  //         }
  //         else{
  //           res.send("Wrong user or password");
  //         }
  //       });
  //       // if (foundUser.password == userPassword){
  //       //   res.render("secrets");
  //       // }
  //       // else {
  //       //   res.send("Wrong user or password");
  //       // }
  //     }
  //   }
  // });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
