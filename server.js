const express = require("express");
const app = express();


const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const authcontroller = require("./controllers/authcontroller");


const initializePassport = require("./config/passport");
const { generateToken } = require("./controllers/jwtcontroller");
initializePassport(passport);

const PORT = process.env.PORT || 4000;

// Set view engine
app.set("view engine", "ejs");

// Middleware to parse form data
app.use(express.urlencoded({ extended: false }));

// Express session
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Flash messages
app.use(flash());

// Routes
app.post("/users/register",authcontroller.register);
app.post("/users/login",authcontroller.login);

app.get("/auth/google/",
  passport.authenticate("google",{
    scope: ["profile", "email"],
    prompt: "consent select_account"})
);

app.get("/auth/google/callback",
  passport.authenticate("google",{
    failureRedirect: "/users/login",
    failureFlash: true
  }),
  
  (req,res)=>{
    console.log(req.user)
    const user = req.user;
    const token = generateToken(user);

    res.json({ user, token });

    //res.redirect("/users/dashboard",token);
  }
 );

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user.lastname });
});

app.get("/users/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success_msg', "You have logged out");
    res.redirect("/users/login");
  });
});


 


// Middleware to prevent logged-in users from accessing login/register
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
    
  }
  next();
}

// Middleware to restrict access to dashboard
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
