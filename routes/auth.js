var express = require("express");
var authRouter = express.Router();
const Dog = require("../models/dog");
const parser = require('./../config/cloudinary');


// 1 - Require `bcrypt` for passwords hashing
// 2 - Create variable for the number of salt rounds
const bcrypt = require("bcrypt");
const zxcvbn = require("zxcvbn");
const saltRounds = 10;

// POST '/'
authRouter.post("/signup", parser.single('photo') ,(req, res) => {
// 3 - Deconstruct the `username` and `password` from req.body
    const image = req.file.secure_url;
    console.log(req.file);

    
    const { dogName, email, password, age, phoneNumber, breed, activity, searchAgeMin, searchAgeMax, searchBreed} = req.body;
    
    const searchPreferencesObj = {
      breed: searchBreed,
      ageMin : searchAgeMin,
      ageMax : searchAgeMax
    }
console.log("req body",req.body);

// 4 - Check if `username` or `password` are empty and display error message
if (password === "" || email === "" || dogName === "" || phoneNumber === "" || age === "") {
    res.render("auth/signup-form", {
      errorMessage: "Something went wrong, try again."
      // Failed to sign up
    });
    return;
}

Dog.findOne( { email } )
    .then( user => {
//if `username` already exists in the DB and display error message
      if (user) {
          console.log("THIS IS THE USER:", user);
          res.render("auth/signup-form", {
              errorMessage: "That e-mail is already registered"
            });
            return;
      }  

// > If `username` doesn't exist generate salts and hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      console.log(hashedPassword)

      Dog.create({ email, password: hashedPassword, dogName, age, phoneNumber, breed, image, activity, searchPreferences: searchPreferencesObj })
        .then(createUser => {
        req.session.currentUser= createUser;
          res.redirect("/profile/swipe") //Donde queremos que vaya despues del register
      })
        .catch(err => {
          res.render("auth/signup-form", {
            errorMessage: "Error while creating the new user."
          });
        });
    })
    .catch(err => console.log(err));
});



// GET    /signup
authRouter.get("/signup", (req, res) => {
  res.render("auth/signup-form");
});

authRouter.get("/login", (req, res) => {
    res.render("auth/login-form");
  });

authRouter.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (password === "" || email === "") {
      res.render("auth/login-form", {
        errorMessage: "Email and Password are required"
      });
      return;
    }

    Dog.findOne({email})
    .then(user => {
      if (!user) {
        res.render("auth/login-form", {
          errorMessage: "The email doesn't exist."
        });
        return;
      }

      const passwordFromDB = user.password;

      const passwordCorrect = bcrypt.compareSync(password, passwordFromDB);

      if(passwordCorrect) {
        //SAVE THE LOGIN SESSION 
        req.session.currentUser = user;
        res.redirect("/profile/swipe");
      } else {
        res.render("auth/login-form", {
          errorMessage: "Incorrect password..."
        });
      }
    })
    .catch(err => console.log(err));
  });

authRouter.get('/logout', (req, res) => {
    req.session.destroy( (err) => {
      res.redirect('/auth/login')
    })
  })

module.exports = authRouter;
