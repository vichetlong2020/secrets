//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const _ = require("lodash");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");//npm to install this encryption package

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
const secret = "Thisisourlittlesecret." //create encryptkey
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]}); //use plunin to encrypt userschema and define the field to be encrypted
const User = mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
  // console.log(req);
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err) {
    if (err) {
      console.log(err);
    }
    else{
      res.render("secrets");
      // console.log("add new record" + user);
    }
  });
});

app.post("/login", function(req, res) {
  const userEmail = req.body.username
  const userPassword = req.body.password
  User.findOne({email: userEmail}, function(err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        if (foundUser.password == userPassword){
          res.render("secrets");
        }
        else {
          res.send("Wrong user or password");
        }
      }
    }
  });
});
