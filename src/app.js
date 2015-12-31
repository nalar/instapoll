var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var models = require('./models');
var Answer = models.Answer;
var Poll = models.Poll;

var app = express();
var io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('less-middleware')(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', function (request, response) {
	response.render('index');
});

app.post('/', function (request, response) {
	var question = request.body.question;
	if (question.length === 0) {
		response.render('index', {error: "please enter a question:"});
		return;
	}

	var answers = [];
	for (var formFieldName in request.body) {
		if (request.body.hasOwnProperty(formFieldName)
			&& formFieldName.indexOf("answer") !== -1
			&& request.body[formFieldName].length !== 0) {

			answers.push({
				name: request.body[formFieldName],
				votes: 0
			});
		}
	}

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
					response.redirect('/' + poll.id);
				}
			})
		});
	});
});

app.get('/:id', function (request, response) {
	var pollId = request.params.id;
	if (!isInteger(pollId)) {
		response.sendStatus(404);
		return;
	}

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

app.post('/:id', function (request, response) {
	var answerId = request.body.voteValue;
	Answer.findById(answerId).then(function (answer) {
		if (answer === null) {
			response.redirect('/' + request.params.id);
		} else {
			answer.increment('votes').then(function () {
				io.emit('vote', {id: answer.id, value: answer.votes});
				response.redirect('/' + request.params.id);
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

function isInteger(value) {
	return !isNaN(value)
		&& parseInt(Number(value)) == value
		&& !isNaN(parseInt(value, 10));
}

module.exports = app;
