var mongoose = require("mongoose");

var rssSchema = mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String
	},
	link: {
		type: String,
		required: true
	},
	created_on: {
		type: Date,
		default: Date.now
	},
	category: {
		type: String,
		required: true
	},
	source: {
		type: String,
		required: true
	}
});

module.exports = mongoose.model('Rss', rssSchema);