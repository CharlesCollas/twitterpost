"use strict";

var Twitter = require('twitter');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('views', './views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
  	res.render('index', {title: 'Search and post tweets', tweets: []});
});

var port = process.env.PORT || 5000;

var client = new Twitter({
  	consumer_key: process.env.CONSUMER_KEY,
  	consumer_secret: process.env.CONSUMER_SECRET_KEY,
  	access_token_key: process.env.TOKEN_KEY,
  	access_token_secret: process.env.TOKEN_SECRET_KEY
});

app.post('/searchonly', function (req, res) {
	client.get('search/tweets', {q: req.body.search, count: req.body.count}, function (error, tweets, response) {
	  	if (error) throw error;
	  	console.log(JSON.parse(response.body).statuses);
	  	res.render('index', {tweets: JSON.parse(response.body).statuses});
	});
});

app.post('/searchandpost', function (req, res) {
	var tweetsIds = [];

	client.get('search/tweets', {q: req.body.search, count: req.body.count}, function (error, tweets, response) {
	  	if (error) throw error;
	  	var allTweets = JSON.parse(response.body).statuses;

	  	for (var i = 0; i < allTweets.length; i++) {
	  		// Avoid to send many tweets to the same user
		  	var alreadyInArray = false;
		  	var entry;
		  	for (var j = 0; j < tweetsIds.length; j++) {
		  		entry = tweetsIds[j];
		  		if (entry.userid == allTweets[i].user.id_str) {
		  			alreadyInArray = true;
		  		}
		  	}
		  	if (!alreadyInArray) {
		  		tweetsIds.push({tweetid: allTweets[i].id_str, userid: allTweets[i].user.id_str, username: allTweets[i].user.screen_name});
		  	}
	  	}

	  	for (var i = 0; i < tweetsIds.length; i++) {
	  		var status = '@' + tweetsIds[i].username + ' ' + req.body.tweetcontent;
			client.post('statuses/update', {status: status, in_reply_to_status_id: tweetsIds[i].tweetid}, function (error, tweet, response) {
			  	if(error) console.log(error);
			});
		}
		res.render('index', {total: tweetsIds.length});
	});
});

app.listen(port, function () {
  	console.log('Server running');
});