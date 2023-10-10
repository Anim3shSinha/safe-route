require("dotenv").config();
const http = require('http');
var express = require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
var bodyParser = require('body-parser');
const socketio = require('socket.io');
const accountSid = "ACc7a09c07721d70e03e75f3a2366c45b1";
const authToken = "d1c98793b8531a5beebd65463c0c8e99";
const client = require('twilio')(accountSid, authToken);
const session = require("express-session");
var passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const TwitterStrategy = require("passport-twitter");
var methodOverride = require("method-override");
const _ = require("lodash");
var path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(session({
	secret: "Our little secret.",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://ankit:aarush1234@cluster0.5ggfrkj.mongodb.net/safe-routes", {
	useNewUrlParser: true
}).then(console.log("Connected to database"));
const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
	twitterId: String,
});
const contactSchema = {
	phone1: String,
	phone2: String,
	phone3: String
};

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Contact = mongoose.model("Contact", contactSchema);
let countContacts = 0;

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});
passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

/////////////////////////GOOGLE STRATEGY///////////////////////////////
passport.use(new GoogleStrategy({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: "http://localhost:3000/auth/google/dashboard",
	userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
	function (accessToken, refreshToken, profile, cb) {
		User.findOrCreate({ username: profile.displayName, googleId: profile.id }, function (err, user) {
			return cb(err, user);
		});
	}
));

//////////////////GOOOGLE ROUTES/////////////////////
app.get("/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/dashboard',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect('/dashboard');
	});



app.use(methodOverride("_method"));

app.get("/", function (req, res) {
	res.render("homePage");
});

app.get("/dashboard", function (req, res) {
	res.sendFile(path.join(__dirname + '/main.html'));
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000 || process.env.PORT;
}
server.listen(port, function () {
	console.log(`Server started on http://localhost:3000/`);
});
