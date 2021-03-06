const router = require('express').Router();
const UserModel = require('../models/User.model');
const bcrypt = require('bcryptjs');

router.get('/signup', (req, res, next) => {
  res.render('auth/signup.hbs');
});

router.post('/signup', (req, res, next) => {
  // get info from the form
  let { username, email, password } = req.body;

  //encrypt the password
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(password, salt);

  // check required fields
  if (username == '') {
    res.render('auth/signup', { error: 'Please enter a username' });
    return;
  }

  let emailRegEx =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!emailRegEx.test(email)) {
    res.render('auth/signup', { error: 'Please Enter Valid Email' });
    return;
  }

  let passwordRegEx = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
  if (!passwordRegEx.test(password)) {
    res.render('auth/signup', {
      error:
        'Password needs to have a special character, a number, and be 6-16 characters',
    });
    return;
  }

  UserModel.findOne({ username }).then((user) => {
    if (!user) {
      UserModel.create({ username, email, password: hash })
        .then((user) => {
          req.session.loggedInUser = user;
          req.app.locals.isLoggedIn = true;
          res.redirect('/profile');
        })
        .catch((err) => {
          next(err);
        });
    } else {
      return res.render('auth/signup.hbs', {
        error: 'Username already exists.',
      });
    }
  });
});

router.get('/signin', (req, res, next) => {
  res.render('auth/signup.hbs');
});

router.post('/signin', (req, res, next) => {
  let { username, password } = req.body;
  UserModel.findOne({ username })
    .then((usernameResponse) => {
      if (usernameResponse) {
        let userObj = usernameResponse;
        let isMatching = bcrypt.compareSync(password, userObj.password);
        if (isMatching) {
          req.session.loggedInUser = userObj;
          res.redirect('/');
        } else {
          res.render('auth/signup.hbs', { error: 'Failed To Sign In' });
          return;
        }
      } else {
        res.render('auth/signup.hbs', { error: 'Please Enter Username' });
        return;
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/signout', (req, res, next) => {
  req.session.destroy();
  res.redirect('/signup');
});

module.exports = router;
