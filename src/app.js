var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var models = require('./models');
var Answer = models.Answer;
var Poll = models.Poll;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', function (request, response) {
	response.render('createPoll');
});

app.post('/createPoll', function (request, response) {
	var question = request.body.question;
	if (question.length === 0) {
		response.render('createPoll', {error: "please enter a question"});
		return;
	}

	var answers = (function () {
		var answers = [];
		for (var formFieldName in request.body) {
			if (request.body.hasOwnProperty(formFieldName)) {
				var splitKey = formFieldName.split('_');
				if (splitKey[0] === 'answer') {
					var answerValue;
					if (request.body[formFieldName].length === 0) {
						if (splitKey[1] === '1') {
							answerValue = 'yes';
						} else if (splitKey[1] === '2') {
							answerValue = 'no'
						} else {
							continue;
						}
					} else {
						answerValue = request.body[formFieldName];
					}

					answers.push({
						name: answerValue,
						votes: 0
					});
				}
			}
		}
		return answers;
	})();

	Poll.create({
		question: question
	}).then(function (poll) {
		var answersToCreate = answers.length;

		answers.forEach(function (answer) {
			Answer.create({
				name: answer.name,
				votes: answer.votes,
				pollId: poll.id
			}).then(function () {
				answersToCreate--;
				if (answersToCreate === 0) {
					response.redirect('/' + poll.id + '/results');
				}
			})
		});
	});
});

app.get('/:id/results', function (request, response) {
	var pollId = request.params.id;
	Poll.findById(pollId, {
		include: [{
			model: Answer
		}],
		order: [[Answer, 'votes', 'DESC']]
	}).then(function (poll) {
		if (poll === null) {
			response.redirect('/');
		} else {
			var answers = poll.answers.map(function (answer) {
				return {
					id: answer.id,
					name: answer.name,
					votes: answer.votes
				}
			});

			response.render('results', {
				pollId: poll.id,
				question: poll.question,
				answers: answers
			});
		}
	});
});

app.post('/:id/vote', function (request, response) {
	var answerId = request.body.voteValue;
	Answer.findById(answerId).then(function (answer) {
		if (answer === null) {
			response.redirect('/' + request.params.id + '/vote');
		} else {
			answer.increment('votes').then(function () {
				io.emit('vote', {id: answer.id, value: answer.votes});
				response.redirect('/' + request.params.id + '/results');
			});
		}
	});
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

app.setSocket = function (_io) {
	io = _io;
};

module.exports = app;
