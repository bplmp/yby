
/*!
 * Module dependencies
 */

var 
	async = require('async'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Feature schema
 */

var FeatureSchema = new Schema({
	creator: { type: Schema.ObjectId, ref: 'User', required: true},
	layers: [{ type: Schema.ObjectId, ref: 'Layer'}],
	contents: [{ type: Schema.ObjectId, ref: 'Content'}],	
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	title: { type: String, required: true },
	description: { type: String },
	geometry: { type: {type: String}, coordinates: []},
	version: { type: Number, default: 1},
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	tags: [String]
})

/**
 * Geo index
 **/

FeatureSchema.index({ loc: '2dsphere' })

/**
 * Methods
 */

FeatureSchema.methods = {
	addContent: function(content) {
		this.contents.push(content);
	},
	removeContent: function(content){
		this.contents = _.without(this.contents, _.findWhere(this.contents, {_id: content._id}));
	}
}

/**
 * Pre-save hooks
 */

FeatureSchema.pre('remove', function(next){
	var self = this;
	async.each(self.contents, function(contentId, done){
		mongoose.model('Content').findById(contentId, function(err, content){
			if (!content) done();
			content.removeFeature(self);
			// content.features = _.without(_.toArray(content.features), self._id);
			content.save(done);
		})
	}, next);
});

/**
 * Statics
 */

FeatureSchema.statics = {

	/**
	 * Find feature by id
	 *
	 * @param {ObjectId} id
	 * @param {Function} cb
	 * @api private
	 */

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator')
			.populate('contents')
			.exec(cb)
	},
	
	/**
	 * List feature
	 *
	 * @param {Object} options
	 * @param {Function} cb
	 * @api private
	 */

	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Feature', FeatureSchema)