
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto'),
	moment = require('moment'),
	notify = require('../mailer');

/**
 * Token schema
 */

var TokenSchema = new Schema({
	_id: String,
	type: {type: String, enum: ['activateAccount', 'password_reset', 'password_needed', 'migrate_account', 'email_change']},
	createdAt: {type: Date, default: Date.now},
	expiresAt: Date,
	user: { type: Schema.ObjectId, ref: 'User'},
	callbackUrl: String,
	data: {}
});

/**
 * Methods
 **/

TokenSchema.methods = {
	isValid: function() {
		return (this.expiresAt > Date.now);
	}
}

/**
 * Statics
 **/
TokenSchema.statics = {
	generateId: function(){
		var seed = crypto.randomBytes(20);
		return crypto.createHash('sha1').update(seed).digest('hex');
	}
}

mongoose.model('Token', TokenSchema);