
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');

/**
 * Controllers dependencies.
 */

var 
	home = require('home'),
	token = require('token'),
	accessToken = require('access_token')
	maps = require('maps'),
	layers = require('layers'),
	features = require('features'),
	contents = require('contents'),
	images = require('images'),
	users = require('users'),
	admin = require('admin'),
	auth = require('./middlewares/authorization');

/**
 * Expose routes
 */

module.exports = function (app, passport) {

	var apiPrefix = '/api/v1';

	/*
	 * Institutional routes
	 */
	app.get('/about', home.about);
	app.get('/tutorial', home.tutorial);
	app.get('/terms-of-use', home.terms);

	/** 
	 * Users routes 
	 **/
	app.get('/migrate', users.showMigrate);
	app.post('/migrate', users.migrate);
	app.post(apiPrefix + '/forgot_password', users.resetPasswordToken);	
	
	app.post(apiPrefix + '/users', users.create);
	app.put(apiPrefix + '/users', auth.requiresLogin, users.update);
	app.get(apiPrefix + '/users/:userId', users.show);

	app.get(apiPrefix + '/user', auth.requiresLogin, users.info);
	app.get(apiPrefix + '/user/layers', auth.requiresLogin, users.layers);
	app.get(apiPrefix + '/user/maps', auth.requiresLogin, users.maps);

	/** 
	 * Token routes
	 **/
	
	// activate account
	app.get('/activate_account/:tokenId', token.activateAccount);

	// accept invitation
	app.get('/accept_invitation/:tokenId', token.acceptInvitationForm);
	app.post('/accept_invitation/:tokenId', token.acceptInvitation);	

	// define new passord
	app.get('/new_password/:tokenId', token.newPasswordForm);
	app.post('/password_reset/:tokenId', token.newPassword);
	app.post('/password_needed/:tokenId', token.newPassword);
	
	// migrate account
	app.get('/migrate_account/:tokenId', token.migrateAccount);
	
	// change e-mail
	app.get('/email_change/:tokenId', token.emailChange);
	app.param('tokenId', token.load);
	
	
	/** 
	 * API ROUTES
	 **/
	
	app.get(apiPrefix + '/settings', admin.apiSettings);
	
	/** 
	 * Access token 
	 **/
	app.post(apiPrefix + '/access_token/local', accessToken.local);
	app.post(apiPrefix + '/access_token/facebook', accessToken.facebook);
	app.post(apiPrefix + '/access_token/google', accessToken.google);
	app.get(apiPrefix + '/access_token/logout', accessToken.logout);

	app.param('userId', users.user)

	/** 
	 * Feature routes 
	 **/
	app.param('featureId', features.load) 
	// new feature should be associated to a layer
	app.get(apiPrefix + '/features', features.index);
	app.get(apiPrefix + '/features/:featureId', features.show);
	app.post(apiPrefix + '/layers/:layerId/features', [auth.requiresLogin, auth.feature.canCreate], features.create);	
	app.post(apiPrefix + '/layers/:layerId/features/import', [auth.requiresLogin, auth.feature.canCreate], features.import);
	app.put(apiPrefix + '/features/:featureId', [auth.requiresLogin, auth.feature.canEditOrDelete], features.update);
	
	/** 
	 * Content routes 
	 **/
	
	app.param('contentId', contents.load);
	// new content should be associated to a layer
	app.get(apiPrefix + '/contents/:contentId', contents.show);
	app.get(apiPrefix + '/contents', contents.index);
	app.post(apiPrefix + '/contents', [auth.requiresLogin, auth.content.canCreate], contents.create);	
	app.put(apiPrefix + '/contents/:contentId', [auth.requiresLogin, auth.content.canEditOrDelete], contents.update);
	app.del(apiPrefix + '/contents/:contentId', [auth.requiresLogin, auth.content.canEditOrDelete], contents.destroy);
	
	/** 
	 * Layer routes 
	 **/
	app.param('layerId', layers.load);
	app.get(apiPrefix + '/layers', layers.index);
	app.post(apiPrefix + '/layers', auth.requiresLogin, layers.create);
	app.get(apiPrefix + '/layers/:layerId', layers.show);
	app.del(apiPrefix + '/layers/:layerId', [auth.requiresLogin, auth.layer.requireOwnership], layers.destroy);
	app.put(apiPrefix + '/layers/:layerId', [auth.requiresLogin, auth.layer.requireOwnership], layers.update);
	app.put(apiPrefix + '/layers/:layerId/contributors/add', [auth.requiresLogin, auth.layer.requireOwnership], layers.addContributor);
	app.del(apiPrefix + '/layers/:layerId/contributors/remove', [auth.requiresLogin, auth.layer.requireOwnership], layers.removeContributor);


	/**
	 * Map routes
	 **/
	app.param('mapId', maps.load);
	app.get(apiPrefix + '/maps', maps.index);
	app.post(apiPrefix + '/maps', auth.requiresLogin, maps.create);
	app.del(apiPrefix + '/maps/:mapId', auth.requiresLogin, maps.destroy);
	app.put(apiPrefix + '/maps/:mapId', auth.requiresLogin, maps.update);
	app.get(apiPrefix + '/maps/:mapId', maps.show);

	
	/**
	 * Images routes
	 **/
	app.param('imageId', images.load);
	app.get(apiPrefix + '/images/:imageId', auth.requiresLogin, images.show);
	app.get('/images', images.showForm);
	app.post(apiPrefix + '/images', auth.requiresLogin, images.create);
	app.del(apiPrefix + '/images', auth.requiresLogin, images.destroy);
	
	/** 
	 * Association routes
	 **/
	
	// layer x feature
	app.put(apiPrefix + '/layers/:layerId/features/:featureId', [auth.requiresLogin, auth.feature.canEditOrDelete], layers.addFeature);
	app.del(apiPrefix + '/layers/:layerId/features/:featureId', [auth.requiresLogin, auth.feature.canEditOrDelete], layers.removeFeature);
	
	// feature x content
	app.put(apiPrefix + '/features/:featureId/contents/:contentId', auth.requiresLogin, features.addContent);
	app.del(apiPrefix + '/features/:featureId/contents/:contentId', auth.requiresLogin, features.removeContent);

	/**
	 * ADMIN ROUTES
	 */
		
	app.get('/admin/first_admin', admin.firstAdminForm);
	app.post('/admin/first_admin', admin.firstAdmin);

	app.get('/admin/login', admin.login);
	app.get('/admin/logout', admin.logout);
	app.post('/admin/session',
			passport.authenticate('local', {
				failureRedirect: '/admin/login',
				failureFlash: 'Invalid email or password.'
			}), admin.session);
	
	app.get('/admin', auth.isAdmin, admin.index);

	// Global settings
	app.get('/admin/settings', auth.isAdmin, admin.settings);
	app.post('/admin/settings', auth.isAdmin, admin.update);

	app.get('/admin/users', admin.users);
	app.get('/admin/users/invite', admin.inviteForm);
	app.post('/admin/users/invite', admin.invite);
	app.get('/admin/users/permissions', admin.permissions);

	app.get('/', function(req, res){
		res.redirect('/admin');
	});

	/*
	 * All other routes enabled for Angular app (no 404)
	 */	
	app.get('/*', home.app);

}
