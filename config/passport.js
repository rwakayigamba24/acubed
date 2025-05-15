require("dotenv").config();
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const { generateToken } = require("../controllers/jwtcontroller");
const { pool } = require("./db");
const bcrypt = require("bcrypt");

function initialize(passport) {
  
  const authenticateUser = (emailOrPhone, password, done) => {
    console.log("Authenticating:", emailOrPhone, password);  
  const isEmail = emailOrPhone.includes("@");
  
    let queryText = isEmail 
      ? `SELECT * FROM users WHERE email = $1`
      : `SELECT * FROM users WHERE phone = $1`;
  
    pool.query(queryText, [emailOrPhone], (err, results) => {
      if (err) throw err;
  
      if (results.rows.length > 0) {
        const user = results.rows[0];

        if (user.provider === 'google'){
          return done(null,false,{message: "You must login with google"});
        }
  
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err; 
  
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid credentials password." });
          }

        });
      } else {
        return done(null, false, {
          message: `${isEmail ? "Email" : "Phone number"} not registered`,
          //message: "Invalid credntials." 
        });
      }
    });
  };
  

  passport.use(
    new LocalStrategy(
      { usernameField: "emailOrPhone", passwordField: "password" },
      authenticateUser
    )
    
  );

  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"

    },
    async(accessToken, refreshToken, profile,done)=>{

      try{
        const email = profile.emails[0].value;
        const firstname = profile.name.givenName;
        const lastname = profile.name.familyName;
              // Check if user already exists
        const existingUser= await pool.query(
        "SELECT * FROM users WHERE email=$1",
        [email]);
        if(existingUser.rows.length > 0){
      
          return done(null,existingUser.rows[0]);
          
        }else{
          //register Googleuser
          const dummyPassword= await bcrypt.hash("google-oauth",10);
          const newUser= await pool.query(
            "INSERT INTO users (firstname,lastname,email,password,provider) VALUES($1,$2,$3,$4,$5) RETURNING *",
            [firstname,lastname,email,dummyPassword,'google']
          );
            return done(null,newUser.rows[0]);
            
            
          }
        } catch(err){
          return done(err,false)
        }

    }
  )
  )

  passport.serializeUser((user, done) =>done(null,user.id));

  passport.deserializeUser((id, done) =>{
    pool.query(
      `SELECT * FROM users WHERE id= $1`,[id],(err,results)=>{
        if(err){
          throw err;
        }
        return done(null,results.rows[0]);
        console.log();
      }
    )
  })
}
module.exports = initialize;