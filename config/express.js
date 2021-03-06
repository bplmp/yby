/*!
 * Module dependencies.
 */

var _ = require('underscore');
var express = require('express');

var mongoStore = require('connect-mongo')(express);
var helpers = require('view-helpers');
var lessMiddleware = require('less-middleware');
var pkg = require('../package');
var flash = require('connect-flash');
var env = process.env.NODE_ENV || 'development';
var mongoose = require('mongoose');
var Settings = mongoose.model('Settings');
var i18n = require('i18next');
var Mailer = require('../lib/mailer');
var Geocoder = require('../lib/geocoder');

/*!
 * Expose
 */

module.exports = function (app, config, passport) {
	// Add basic auth for staging
	if (env === 'staging') {
		app.use(express.basicAuth(function(user, pass){
			return 'username' == user && 'password' == pass
		}))

		app.use(function (req, res, next) {
			if (req.remoteUser && req.user && !req.user._id) {
				delete req.user
			}
			next()
		})
	}
	
	

	app.set('showStackError', true)

	app.use(express.logger('dev'))

	// views config
	app.set('views', config.root + '/app/views')
	app.set('view engine', 'jade')

	var allowCrossDomain = function(req, res, next) {
		if (req.app.locals.settings.general.allowedDomains) {

			var domains = req.app.locals.settings.general.allowedDomains.split(',');

			domains = _.map(domains, function(d){return d.trim();})

			if (domains[0] == '*') {
				res.set('Access-Control-Allow-Origin', req.headers.origin);
			} else {
				if (_.contains(domains, req.headers.origin)) 
					res.header('Access-Control-Allow-Origin', req.headers.origin);
			}
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
			res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
		}
		next();
	}

	app.configure(function () {

		// setup less
		app.use(lessMiddleware(config.root + '/public', [{
			compress: true,
			force: true
		}]));
		
		app.use(express.static(config.root + '/public'))	 

		app.use(express.json({limit: '5mb'}));
		app.use(express.urlencoded({limit: '5mb'})); 

		// bodyParser should be above methodOverride
		app.use(express.bodyParser())

		// i18next
		i18n.init(config.i18n);
		app.use(i18n.handle);
		i18n.registerAppHelper(app);

		// cookieParser should be above session
		app.use(express.cookieParser())
		app.use(express.session({
			secret: pkg.name,
			store: new mongoStore({
				url: config.db,
				collection : 'sessions'
			}, function(){
				console.log('MongoDB connected.');
				// start geocoder
				new Geocoder();
			})
		}));

		// Passport session
		app.use(passport.initialize())
		app.use(passport.session())

		// Flash messages
		app.use(flash())

		// expose pkg and node env to views
		app.use(function (req, res, next) {
			res.locals.pkg = pkg
			res.locals.env = env
			next()
		})

		// View helpers
		app.use(helpers(pkg.name))

		// Setup CORS
		app.use(allowCrossDomain);

		// routes should be at the last
		app.use(app.router)

		// custom error handler
		app.use(function (err, req, res, next) {
			if (err.message
				&& (~err.message.indexOf('not found')
				|| (~err.message.indexOf('Cast to ObjectId failed')))) {
				return next()
			}

			console.error(err.stack)
			res.status(500).render('500')
		})

		app.use(function (req, res, next) {
			res.status(404).render('404', { url: req.originalUrl })
		})

		// Load settings from DB
		Settings.load(function(err, settings){
			if (!err) {
				
				settings = settings.toObject();
				delete settings.__v;
				delete settings._id;

				// make global
				app.locals({settings: _.extend(app.locals.settings, settings)});

				app.locals.mailer = new Mailer(settings);


			}
		})

	})

	// development specific stuff
	app.configure('development', function () {
		app.locals.pretty = true;
	})

	// staging specific stuff
	app.configure('staging', function () {
		app.locals.pretty = true;
	})
}
