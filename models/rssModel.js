var mongoose = require("mongoose");
var mongoosastic = require('mongoosastic');

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

rssSchema.plugin(mongoosastic, {
    "host": "localhost",
    "port": 9200
});

var rssModel = mongoose.model('Rss', rssSchema);

rssModel.createMapping((err, mapping) => {
	if (err){
		console.log("error in mapping");
	}else{
	    console.log('mapping created');
	}
});
module.exports = rssModel;