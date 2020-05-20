var express = require('express');
var router = express.Router();
let rssModel = require("../models/rssModel.js");
let cron = require('node-cron');
let Parser = require('rss-parser');
let parser = new Parser();
let date = new Date();
let daysToDeletion = 1;
let deletionDate = new Date(date.setDate(date.getDate() - daysToDeletion));


router.get('/save', (req, res) => {
	let feed = new rssModel({
		title: "imp title",
		description: "desc",
		category: "sports",
		source: "bbc"
	});

	feed.save(function(err, doc){
		if (err){
			console.log("ERROR!!!");
     		console.error(err)
		}else{
			console.log("I AM INSIDE");
     		console.log(doc)
		}
	});
});

//cron.schedule('*/2 * * * *', cronJob);


function removeOldFeeds(){
	return new Promise(resolve => {
		rssModel.remove({created_on : {$lt : deletionDate}}, function(err, res){
			resolve(res);
		});

	});
}

async function cronJob(){

	console.log("cron job ho ho")
	let feeds = [];
	let feedsBBC = await getFeedsFromURL('http://feeds.bbci.co.uk/news/rss.xml?edition=int', 'BBC', 'World');
	let feedsTOI = await getFeedsFromURL('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'Times of India', 'Top') 
	let del = await removeOldFeeds();


	feeds.push(feedsBBC);
	feeds.push(feedsTOI);
	//res.send(feeds);
	console.log(feeds);
}

router.get('/cronJob', (req, res) => {
	cronJob();
});


async function getFeedsFromURL(url, src, cat){
	return new Promise(async resolve => {
		
		let feed = await parser.parseURL(url);
  		feed = feed.items;
		let feedsList = new Array();
		let ctr = Math.min(10, feed.length);  
	  	for (let i = 0; i < ctr; i++){
	  		item = feed[i];
	  		let feedObj = new rssModel({
				title: item.title,
				description: item.contentSnippet,
				link: item.link,
				category: cat,
				source: src
			});
			feedObj.save(function(err, doc){
				if (err){
					console.log(err);
				}else {
					console.log(doc);
				}
			});
	  		feedsList.push(feedObj);
	  	}

	  	resolve(feedsList);
	});
}

/* GET home page. */
router.get('/', async function(req, res, next) {

	
	rssModel.find({'category': 'World'}).sort('-created_on').limit(10).exec(function(err, feeds){

		if (err){
			console.log("ERROR!!!");
		}

		console.log(feeds);
	    res.send(feeds);    
	    
	});
	
    //res.render('pages/index', {arr: list});
    /*
  	feedparser.on('readable', function () {
	  // This is where the action is!
	  var stream = this; // `this` is `feedparser`, which is a stream
	  var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
	  var item;
	  var ctr = 0;

	  while ((item = stream.read()) && ctr < 10) {
	    console.log(item);
	    list.push(item.link);
	    ctr += 1;
	  }
	  res.send(list);
	});*/


  
});

module.exports = router;
