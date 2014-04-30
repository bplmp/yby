/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	crypto = require('crypto'),
	messages = require('../../lib/messages'),
	mailer = require('../../lib/mailer'),
	https = require('https'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken');


var generateAccessToken = function(user, res) {

	var token = new AccessToken({user: user._id});

	var seed = crypto.randomBytes(20);
	token._id = crypto.createHash('sha1').update(seed).digest('hex');

	token.save(function(err) {
		if (err) {
			console.log(err);
			return res.json(401, {messages: messages.mongooseErrors(req.i18n, err)});
		}

		var response = _.extend({
			accessToken: token._id
		}, user.info());

		res.json(response);

	});

}

var authSocialUser = function(provider, profile, res) {

	var 
		userProfile = {};

	switch (provider) {
		case 'google':
			userProfile.email = profile.emails[0].value;
			userProfile.name = profile.displayName;
			userProfile.google = profile;
			break;		
		case 'facebook':
			userProfile.email = profile.email;
			userProfile.name = profile.name;
			userProfile.facebook = profile;
			break;
	} 

	User.load({email: userProfile.email}, function(err, user){
		if (err)
			return res.json(401, {messages: messages.error(req.i18n.t('access_token.authsocial.error.load_user'))});
		if (!user) {

			user = new User(userProfile);
			user.save(function(err){
				if (err)
					return res.json(401, {messages: messages.error(req.i18n.t('access_token.authsocial.error.save_user'))});
				generateAccessToken(user, res);
			})
		} else {

			// add third party info if not present
			if ((provider == 'google') && (!user.google)) {
				user.google = profile;
			}

			if (user.isModified) {
				user.save(function(err){
					if (err) return res.json(400, {messages: messages.mongooseErrors(req.i18n, err)});
					generateAccessToken(user, res);	
				})
			} else generateAccessToken(user, res);	
		}  
	})
}

exports.google = function(req, res){

	if (req.headers.authorization) {
		var authorizationField = req.headers.authorization.split(' ');
		if (authorizationField[0] = 'Bearer'){
			
			https.get('https://www.googleapis.com/plus/v1/people/me?access_token='+authorizationField[1], function(response) {
				var body = '';

				if (response.statusCode == 200) {
					response.on('data', function(d) {
						body += d;
					});

					response.on('end', function(){
						var profile = JSON.parse(body);
						authSocialUser('google', profile, res);
					});					
				} else {
					res.json(response.statusCode);
				}

			}).on('error', function(e) {
				res.json(e);
			});
		}
	} else {
		return res.json(400, {messages: messages.error(req.i18n.t('access_token.google.error.missing_token'))});
	}
}

exports.facebook = function(req, res, next) {

	if (req.headers.authorization) {
		var authorizationField = req.headers.authorization.split(' ');
		if (authorizationField[0] = 'Bearer'){
			

			https.get('https://graph.facebook.com/me?access_token='+authorizationField[1], function(response) {
				var body = '';

				if (response.statusCode == 200) {
					response.on('data', function(d) {
						body += d;
					});

					response.on('end', function(){
						var profile = JSON.parse(body);
						authSocialUser('facebook', profile, res);
					});					
				} else {
					res.json(response.statusCode);
				}

			}).on('error', function(e) {
				res.json(e);
			});
		}
	} else {
		return res.json(400, {messages: messages.error(req.i18n.t('access_token.facebook.error.missing_token'))});
	}


};

exports.local = function(req, res, next) {

	passport.authenticate('local', function(err, user, info) {

		// Unknown error  
		if (err) { 
			return res.json(400, {messages: messages.mongooseError(req.i18n, err)});

		// Error raised by passport
		} else if (info && info.message) { 
			res.json(400, { messages: messages.error(req.i18n.t(info.message))}); 

		// User not found.
		} else if (!user) { 
			return res.json(403, { messages: messages.error(req.i18n.t("access_token.local.unauthorized"))}); 
		}

		// User needs to finish migration.
		else if (user.status == 'to_migrate') {
			return res.json(400, {messages: messages.error(req.i18n.t("access_token.local.needs_migration"))}); 

		// User doesn't have a password, because it logged before via Facebook or Google
		} else if (!user.hashed_password) {
			mailer.passwordNeeded(user, req.app.locals.settings.general.serverUrl, user.callback_url, function(err){
				if (err)
					return res.json(400, { messages: messages.error(req.i18n.t("access_token.local.error.send_email"))}); 
				else
					return res.json(400, { messages: messages.error(req.i18n.t("access_token.local.error.need_password"))}); 
			});				
	
		// User needs to confirm his email
		} else if (user.needsEmailConfirmation) {
			mailer.confirmEmail(user, req.app.locals.settings.general.serverUrl, req.body.callback_url, function(err){
				if (err)
					return res.json(400, {messages: messages.error(req.i18n.t("access_token.local.error.send_email"))}); 
				else
					return res.json(400, {messages: messages.error(req.i18n.t("access_token.local.error.needs_activation"))}); 
			});

		// Login successful, proceed with token 
		} else {
			generateAccessToken(user, res);
		}




	})(req, res, next);

};

exports.logout = function(req, res, next) {

	req.logout();

	if (req.headers.authorization) {
		var access_token = req.headers.authorization.split(' ')[1];
		AccessToken.findOne({_id: access_token}, function(err, at){
			if (err) return res.json(400, err);
			if (!at) return res.json(400, {messages: messages.error(req.i18n.t("access_token.logout.error.inexistent_token"))});

			at.expired = true;
			at.save(function(err){
				if (err) return res.json(400, err);
				else return res.json({messags: messages.success(req.i18n.t('access_token.logout.successful'))});
			});
		});
	} else {
		res.json(400, {messages: messages.error(req.i18n.t('access_token.logout.error.not_logged'))});
	}


};