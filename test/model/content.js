/*
 * Module dependencies.
 */

var 
	async = require('async'),
	_ = require('underscore'),
	request = require('supertest'),
	should = require('should'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	Layer = mongoose.model('Layer'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	User = mongoose.model('User'),
	Factory = require('../../lib/factory');

var
	user1,
	user1Layer1,
	user1Content,
	user1Feature1,
	user1Feature2;

describe('Content Model', function(){

	// Create a content with features 
	before( function (doneBefore) {

		async.series([
			function(done){
				Factory.create('User', function(usr){
					user1 = usr;
					done(null);
				});
			}, 
			function(done){
				Factory.create('Layer', function(lyr){
					user1Layer1 = lyr;
					done(null);
				})
		}], doneBefore);
		
	});

	describe('.updateFeaturesAssociationAndSave()', function(){
		var
			feature1,
			feature2,
			content;

		before(function(done){
			Factory.create('Feature', {creator: user1._id, layers: [user1Layer1._id]}, function(ft1){
				feature1 = ft1;
				Factory.create('Feature', {creator: user1._id, layers: [user1Layer1._id]}, function(ft2){
					feature2 = ft2;
					Factory.create('Content', {creator: user1._id, layer: [user1Layer1._id]}, function(ct1){
						content = ct1;
						done();
					});
				});
			});
		});

		it('should set association in both sides', function(done){
			content.updateFeaturesAssociationAndSave([feature1, feature2], function(err){
				should.not.exist(err);
				Content.findById(content._id, function(err, ct){
					should.not.exist(err);
					ct.features.should.include(feature1._id);
					ct.features.should.include(feature2._id);
					Feature.findById(feature1._id, function(err, ft1){
						should.not.exist(err);
						ft1.contents.should.include(content._id);
						Feature.findById(feature2._id, function(err, ft2){
							should.not.exist(err);
							ft2.contents.should.include(content._id);
							done();
						});
					});
				});
			});
		});
	});
});