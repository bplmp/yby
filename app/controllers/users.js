
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , extend = require('util')._extend
  , _ = require('underscore');

var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/dashboard';
  delete req.session.returnTo;
  res.redirect(redirectTo);
}

exports.signin = function (req, res) {}

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
  var query = { username:id };
  if(id.match(/^[0-9a-fA-F]{24}$/)) // change query if id string matches object ID regex
    query = { _id: id };
  User
    .findOne(query)
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      next()
    });
}

/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login',
    message: req.flash('error'),
    user: req.user ? JSON.stringify(req.user) : 'null'
  });
}

/**
 * Show forgot password form
 */

exports.forgot = function (req, res) {
  res.render('users/forgot', {
    title: 'Recuperar senha',
    message: req.flash('error')
  });
}

/**
 * Send reset password token
 */

exports.sendToken = function (req, res) {
	User.findOne({
		$and: [
			{ provider: 'local' }, // ignore users authenticating in third parties
			{
				$or: [
				{email: req.body['emailOrUsername']}, 
				{username: req.body['emailOrUsername']}
				]
			}
		]
	}, function(err,user){
		if (err) 
			res.render('users/forgot', {
				title: 'Recuperar senha',
				message: req.flash('error')
			});
		else {
			if (user) 
				user.sendResetToken();

			res.render('users/forgot', {
				title: 'Recuperar senha',
				message: req.flash('error')
			});
			
		}
	})
}


/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
}

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/login');
}

/**
 * Session
 */

exports.session = login;

/**
 * Create user
 */

exports.create = function (req, res) {
  var user = new User(req.body);
  user.provider = 'local';
  user.save(function (err) {
    if (err) {
      return res.json({
        errors: utils.errors(err.errors),
        user: user
      });
    }

    // manually login the user once successfully signed up
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/');
    })
  })
}

/**
 * Update user
 */

exports.update = function (req, res) {
  var 
    user;

  User.findById(req.user._id, function(err, usr){
    
    // User is not changing password
    if (!req.body.userPwd) {
      usr.bio = req.body.bio;
      usr.username = req.body.username;
      usr.email = req.body.email;
    } else {
      if (!usr.authenticate(req.body.userPwd)) {
        return res.json(400, { errors: { authentication: "Invalid Password"} });
      } else {
        if (req.body.newPwd != req.body.validatePwd) 
          return res.json(400, { errors: { validation: "Passwords don't mach"} });
        else
          usr.password = req.body.newPwd;
      }
    }

    usr.save(function(err){
      if (err) res.json(400, { errors: utils.errors(err.errors)});
      else res.json({sucess:true});
    });    
  });
}

/**
 *  Show a user profile
 */

exports.show = function (req, res) {
  res.json(req.profile);
}
