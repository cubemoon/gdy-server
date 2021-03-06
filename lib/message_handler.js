// project dependences
var message = require("./comm/message")
	,createPlayer = require('./player').createPlayer
	,database = require('./database');

var callbacks={}; // message handle callback functions

// Set message handle callback functions

// default message handle function
callbacks["f_default"] = function(session, msg){
	DBG_LOG("i", msg.cmd);
	if( session.state != "LOGINED" ){
		session.sendMessage(message.new("ERROR"));
		session.end();
	}
	else{
		session.sendMessage(message.newResp(msg));
	}
}

// hello_ok message handle function
callbacks["f_hello_resp"] = function(session, msg){
	clearTimeout(session.helloTimer);

	session.timer = setTimeout(function(){
			session.sendMessage(message.new("HELLO"));
		}, 5000);

	DBG_LOG("i", "receive hello_resp");
}

// connect message handle function
callbacks["f_connect"] = function(session, msg){
	clearTimeout(session.timer);
	if( session.state == "CONNECT"){
		session.state = "LOGIN";
		session.sendMessage(message.new("CONNECT_OK"));
		session.timer = setTimeout(function(){
			DBG_LOG("i", "Session timeout.");
			session.end();
		}, 30000);
	}
	else{
		session.end();
	}
}

// login message handle function
callbacks["f_login"] = function(session, msg){
	if( typeof(session.socket) == "undefined" )
		throw "Error";

	database.login(msg.username, msg.password ,function(success){
		if(success){
			clearTimeout(session.timer);
			// Send login success message.
			session.sendMessage(message.new("LOGIN_OK"));
			// set session state
			session.state="LOGINED";
			// create player
			session.setPlayer( createPlayer(msg.username) );
			
			// start hello timer.
			session.timer = setTimeout(function(){
					DBG_LOG("send hello");
					session.sendMessage(message.new("HELLO"));
					session.helloTimer = setTimeout(function(){
						session.end();
						DBG_LOG("e", "hello timeout");
					}, 2000);
				}, 2000);
		}else{
			try{
				session.sendMessage(message.new("LOGIN_FAILED"));
				session.end();
			}
			catch(e){
				DBG_LOG("e", e);
			}
		}
	});
}

// util functions
function dumpMessage(msg){
	DBG_LOG(msg);
}

callbacks["f_list_room"] = function(session, msg){
	var m = message.new("LIST_ROOM_RESP");
	m.rooms = getServer().getRooms();
	session.sendMessage(m);
}

callbacks["f_quit"] = function(session, msg){
	var m = message.new("QUIT_RESP");
	session.sendMessage(m);
	session.end();
}

callbacks["f_get_name"] = function(session, msg){
	var m = message.newResp(msg);
	m.name = session.getPlayer().name;
	session.sendMessage(m);
}

callbacks["f_who"] = function(session, msg){
	var m = message.newResp(msg);
	m.u = session.getPlayer().name;
	session.sendMessage(m);
}

callbacks["f_select_room"] = function(session, msg){

}

callbacks["f_count"] = function(session, msg){
	var m = message.newResp(msg);
	m.count = getServer().getPlayerCount();
	session.sendMessage(m);
}

callbacks['f_server_name'] = function(session, msg){
	var m = message.newResp(msg);
	m.server_name = getServer().getServerName();
	session.sendMessage(m);
}

module.exports.handler = callbacks;
