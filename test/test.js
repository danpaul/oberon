// To test, start app and hit in browser:
// 	node test.js

var assert = require('assert')
var async = require('async')
var express = require('express')

var nodemailer = require('nodemailer')
// var smtpTransport = require('nodemailer-smtp-transport');

var Oberon = require('../index')

var config = require('../secret')

// console.log(config)

var dbCreds = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'sql_login',
        port:  8889
    }
}

var knex = require('knex')(dbCreds)

var transporter = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
        user: config.email.user,
        pass: config.email.password
    }
});

var oberon = new Oberon({
	 knex: knex,
	 transporter: transporter
});

var app = express()

var sessions = require("client-sessions");

app.use(sessions({
	cookieName: 'session', // cookie name dictates the key name added to the request object
	secret: config.sessionKey,
  	duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  	activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));

app.get('/', function (req, res) {
	runTest(req, res);
})

var runTest = function(req, res){

	req.session.reset();

	var userId;
	var user;
	var verificationCode;
	var resetCode;

	async.waterfall([

		function(callback){
	        knex('user_test').truncate()
	            .then(function(){ callback(); })
	            .catch(callback)
		},

		function(callback){
			oberon.createUser({email: 'pt2323@gmail.com', password: 'asdfasdf'}, function(err, user){
				if( err ){ console.log(err) }
				else{ callback() }
			})
		},

		function(callback){
			oberon.checkThenLogin({
				email: 'pt2323@gmail.com',
				password: 'asdfasdf'
			},
			req.session,
			function(err, response){
				if( err ){ callback(err) }
				else{
					assert((response.status === 'success'), 'Login status should be success.')
					callback();
				}
			})
		},

		function(callback){
			assert( oberon.isLoggedIn(req.session), 'User should be logged in.' )
			callback()
		},

		// confirm user is not confirmed
		function(callback){
			oberon.isConfirmed(req.session, function(err, confirmed){
				if( err ){ callback(err) }
				else{
					assert( (confirmed === false), 'User should not be confirmed.' )
					callback()

				}
			})
		},

		function(callback){
			oberon.getUser(req.session.userId, function(err, userIn){
				if(err){ callback(err) }
				else{
					user = userIn
					callback()
				}
			})
		},

		// confirm bad token
		function(callback){
			oberon.confirmUser(user.id, 'INVALID_TOKEN', function(err, response){
				if( err ){ callback(err) }
				else{
					assert(response.status === 'failure')
					callback()
				}
			})
		},

		// confirm user
		function(callback){
			oberon.confirmUser(user.id, user.confirmation_token, function(err, response){
				if( err ){ callback(err) }
				else{
					assert(response.status === 'success')
					callback()
				}
			})
		},

		function(callback){

			oberon.getResetCode(user.id, function(err, response){
				if( err ){ callback(err)}
				else {
					resetCode = response.resetCode;
					callback()
				}
			})
		},

		// reset password
		function(callback){
			oberon.resetPasswordWithCode(user.id, resetCode, 'ffffffff', function(err){
				if( err ){
					callback(err)
				} else {
					callback()
				}
			})
		},

		// logout user
		function(callback){
			oberon.logOut(req.session, callback)
		},

		// confirm user logged out
		function(callback){
			assert((oberon.isLoggedIn(req.session) === false), 'User should be logged out.')
			callback()
		},

		// login user w/new password
		function(callback){
			oberon.checkThenLogin({
				email: 'pt2323@gmail.com',
				password: 'ffffffff'
				// password: 'asdfasdf'
			},
			req.session,
			function(err, response){
				if( err ){ callback(err) }
				else{
					callback();
					assert(oberon.isLoggedIn(req.session), 'User should be logged in.')

				}
			})
		},
	],

	function(err){
		if( err ){ 
			console.log('Error occured: ')
			console.log(err) 
			res.send('error')
		} else {
			console.log('Oberon test completed successfully.')
			res.send('success')			
		}
		
	})

}

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('App listening at http://%s:%s', host, port)

})