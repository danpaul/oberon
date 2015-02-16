(function(){

// var _ = require('underscore')
// var async = require('async')
// var bcrypt = require('bcrypt')

var SqlLogin = require('sql_login')
// var base64url = require('base64url')
// var crypto = require('crypto')

var transporter = require('transporter')

// Options include: knexObject, tableName
module.exports = function(options, callback){

    var self = this

    self.knex = null
    self.transporter = null
    self.sqlLogin = null

    this.init = function(){
        // if( self.exists(options.knex) ){ self.knex = options.knex; }
        self.knex = options.knex;
        self.transporter = options.transporter;
        self.sqlLogin = new SqlLogin(
            {knex: self.knex, tableName: 'user_test'},
            function(err){ if(err){ console.log(err); } }
        )
        self.getUser = self.sqlLogin.getUser;
        self.confirmUser = self.sqlLogin.confirmUser;
        self.getResetCode = self.sqlLogin.getResetCode;
        self.resetPasswordWithCode = self.sqlLogin.resetPasswordWithCode;
    }

    // userInfo must include: email, password
    this.createUser = function(userInfo, callback){
        self.sqlLogin.create(userInfo, function(err, response){
            if(err){
                callback(err)
            } else {
                if( response.status === 'success' ){

// WHILE TESTING DONT DELETE
// callback(null, response)
// return;

                    self.sendConfirmation(response, function(err){
                        if( err ){ callback(err) }
                        else{
                            callback(null, response)
                        }
                    })
                } else {
                    callback(null, response)
                }
            }
        })
    }

    // returns user Id if set, else retunrs null
    this.getUserId = function(session){
        if( self.exists(session) &&
            self.exists(session.userId) ){
            return session.userId
        } else {
            return null;
        }
    }

    this.sendConfirmation = function(response, callback){

        var emailBody = "Click the link below to complete your registration";

        var mailOptions = {
            from: 'bhbdmpcobr@gmail.com',
            to: response.user.email,
            subject: 'Please confirm your account',
            text: emailBody
            // html: ''
        };

        // send mail with defined transport object
        self.transporter.sendMail(mailOptions, function(err, info){
            if(err){ callback(err)
            }else{ callback(); }
        });
    }

    this.exists = function(thing){
        if( typeof(thing) !== 'undefined' ){ return true; }
        return false;
    }

    // options must include: email, password
    // callback gets passed response object with status, (success/failure)
    this.checkThenLogin = function(options, session, callback){
        session.isLoggedIn = false;
        self.sqlLogin.checkPassword(options, function(err, response){
            if(err){ callback(err) }
            else {
                if( response.status !== 'success' ){
                    callback(null, response);
                } else {
                    session.userEmail = options.email
                    session.userId = response.userId
                    session.isLoggedIn = true
                    session.isConfirmed = response.isConfirmed
                    callback(null, response)
                }
            }
        })
    }

    this.isConfirmed = function(session, callback){
        var userId = self.getUserId(session);
        if( userId === null ){
            callback(null, false);
            return;
        }

        self.sqlLogin.getUser(userId, function(err, user){
            if( err ){
                callback(err);
                return;
            }
            callback(null, (user.is_confirmed == true));
        })

    }

    this.isLoggedIn = function(session){
        if( self.exists(session) &&
            self.exists(session.isLoggedIn) &&
            session.isLoggedIn === true ){
            return true;
        } else {
            return false;
        }
    }

    this.logOut = function(session, callback){
        session.reset()
        callback()
    }

    this.init()

};


}())