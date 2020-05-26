var express = require('express');
var router = express.Router();
let rssModel = require("../models/rssModel.js");
let cron = require('node-cron');
let Parser = require('rss-parser');
let parser = new Parser();
let date = new Date();
let daysToDeletion = 1;
let deletionDate = new Date(date.setDate(date.getDate() - daysToDeletion));

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
	let feedsWorldBBC = await getFeedsFromURL('http://feeds.bbci.co.uk/news/rss.xml?edition=int', 'BBC', 'World');
	let feedsTopBBC = await getFeedsFromURL('http://feeds.bbci.co.uk/news/rss.xml', 'BBC', 'Top');
	let feedsBusinessBBC = await getFeedsFromURL('http://feeds.bbci.co.uk/news/business/rss.xml', 'BBC', 'Business');
	let feedsEntertainmentBBC = await getFeedsFromURL('http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', 'BBC', 'Entertainment');

	let feedsWorldTOI = await getFeedsFromURL('https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', 'Times of India', 'World');
	let feedsTopTOI = await getFeedsFromURL('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'Times of India', 'Top');
	let feedsBusinessTOI = await getFeedsFromURL('https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', 'Times of India', 'Business');
	let feedsSportsTOI = await getFeedsFromURL('https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', 'Times of India', 'Sports');
	let feedsEntertainmentTOI = await getFeedsFromURL('https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', 'Times of India', 'Entertainment');

	let feedsWorldHT = await getFeedsFromURL('https://www.hindustantimes.com/rss/world/rssfeed.xml', 'Hindustan Times', 'World');
	let feedsTopHT = await getFeedsFromURL('https://www.hindustantimes.com/rss/topnews/rssfeed.xml', 'Hindustan Times', 'Top');
	let feedsSportsHT = await getFeedsFromURL('https://www.hindustantimes.com/rss/sports/rssfeed.xml', 'Hindustan Times', 'Sports');
	let feedsBusinessHT = await getFeedsFromURL('https://www.hindustantimes.com/rss/business/rssfeed.xml', 'Hindustan Times', 'Business');
	let feedsEntertainmentHT = await getFeedsFromURL('https://www.hindustantimes.com/rss/entertainment/rssfeed.xml', 'Hindustan Times', 'Entertainment');

	let feedsWorldNDTV = await getFeedsFromURL('https://feeds.feedburner.com/ndtvnews-world-news', 'Ndtv', 'World');
	let feedsTopNDTV = await getFeedsFromURL('https://feeds.feedburner.com/ndtvnews-top-stories', 'Ndtv', 'Top');
	let feedsSportsNDTV = await getFeedsFromURL('https://feeds.feedburner.com/ndtvsports-latest', 'Ndtv', 'Sports');
	let feedsBusinessNDTV = await getFeedsFromURL('https://feeds.feedburner.com/ndtvprofit-latest', 'Ndtv', 'Business');
	let feedsEntertainmentNDTV = await getFeedsFromURL('https://feeds.feedburner.com/ndtvmovies-latest', 'Ndtv', 'Entertainment');


	let del = await removeOldFeeds();


	feeds.push(feedsTopBBC);
	feeds.push(feedsSportsTOI);
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
			feedObj.on('es-indexed', (err, result) => {
				if (err){
					console.log("error in eleasticsearch!!");
				}
			    console.log('indexed to elastic search');
			});
	  		feedsList.push(feedObj);
	  	}

	  	resolve(feedsList);
	});
}


function getFeedsFromDB(cat){
	return new Promise(resolve => {
		rssModel.find({'category': cat}).sort('-created_on').limit(10).exec(function(err, feeds){

			if (err){
				console.log("ERROR!!!");
			}

			console.log(feeds);
		    resolve(feeds);
		    
		});
	});
}

/* GET home page. */
router.get('/', async function(req, res, next) {

	let topFeeds = await getFeedsFromDB('Top');
	let worldFeeds = await getFeedsFromDB('World');
	let sportsFeeds = await getFeedsFromDB('Sports');
	let businessFeeds = await getFeedsFromDB('Business');
	let entertainmentFeeds = await getFeedsFromDB('Entertainment');

	res.render('pages/index', {
	    topFeeds: topFeeds,
	    worldFeeds: worldFeeds,
	    sportsFeeds: sportsFeeds,
	    businessFeeds: businessFeeds,
	    entertainmentFeeds: entertainmentFeeds
	});    
	    
  
});

function getFeedsFromES(query){
	return new Promise(resolve => {
		rssModel.search({
		  query_string: {
		    query: query
		  }
		}, function(err, results) {
			var feedsList = [];
		  	var hits = results.hits.hits;
		  	hits.forEach(feed => {
		  		feedsList.push(feed._source);
		  	});

		  	resolve(feedsList);
		});
	});
}

router.post('/search', async function(req, res){
	console.log("here");
	console.log(req.body);

	let query = req.body.query;
	console.log(query);

	let searchFeeds = await getFeedsFromES(query);

	res.render('pages/search', {
	    searchFeeds: searchFeeds
	});  

});

router.get('/customize', async function(req, res){
	res.render('pages/customize');  
});


function getCustomizedFeedsFromDB(cat, agencies){
	return new Promise(resolve => {
		rssModel.find({ "source" : { "$in": agencies },
						"category": cat
					}).sort('-created_on').limit(10).exec(function(err, feeds){

			if (err){
				console.log("ERROR!!!");
				console.log(err);
			}

			console.log("feeds: ", feeds);
		    resolve(feeds);
		    
		});
	});
}

router.post('/retrieveCustomized', async function(req, res){

	const obj = JSON.parse(JSON.stringify(req.body));
	console.log("body: ", obj);
	let agencies_string = obj['agencies'];
	let agencies = agencies_string.split(',');

	console.log(agencies);
	let topFeeds = await getCustomizedFeedsFromDB('Top', agencies);
	let worldFeeds = await getCustomizedFeedsFromDB('World', agencies);
	let sportsFeeds = await getCustomizedFeedsFromDB('Sports', agencies);
	let businessFeeds = await getCustomizedFeedsFromDB('Business', agencies);
	let entertainmentFeeds = await getCustomizedFeedsFromDB('Entertainment', agencies);

	console.log("here");
	//res.send(topFeeds);
	
	res.render('pages/index', {
	    topFeeds: topFeeds,
	    worldFeeds: worldFeeds,
	    sportsFeeds: sportsFeeds,
	    businessFeeds: businessFeeds,
	    entertainmentFeeds: entertainmentFeeds
	});    
	
});


module.exports = router;
