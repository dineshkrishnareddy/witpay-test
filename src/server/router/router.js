var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');

module.exports = function (app,io){
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({     
        extended: true
    }));
    
    app.get('/',function(req,res){
        res.sendFile(path.resolve("src/client/index.html"));
    });
    
    app.post('/register',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        var user={
            "name":req.body.name,
            "handle":req.body.handle,
            "password":req.body.password
        };
        
        models.user.findOne({"handle":req.body.handle},function(err,doc){
            if(err){
                res.json(err); 
            }
            if(doc == null){
                models.user.create(user,function(err,doc){
                    if(err) res.json(err);
                    else{
                        res.send("success");
                    }
                });
            }else{
                res.send("User already found");
            }
        })
        
    });
    
    
    var handle=null;
    var users={};
    var keys={};
    
    app.post('/login',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.body.handle;
        models.user.findOne({"handle":req.body.handle, "password":req.body.password},function(err,doc){
            if(err){
                res.send(err); 
            }
            if(doc==null){
                res.send("User has not registered");
            }
            else{
                res.send("success");
            }
            
    });
    });
    
    io.on('connection',function(socket){
        io.to(socket.id).emit('handle', handle);
        users[handle]=socket.id;
        keys[socket.id]=handle;
        models.user.find({"handle" : handle},{friends:1,_id:0},function(err,doc){
            if(err){res.json(err);}
            else{
                friends=[];
                pending=[];
                all_friends=[];
                list=doc[0].friends.slice();
                
                for(var i in list){
                    if(list[i].status=="Friend"){
                        friends.push(list[i].name);
                    }
                    else if (list[i].status=="Pending"){
                        pending.push(list[i].name);
                    }
                    else{
                        continue;
                    }
                }
                io.to(socket.id).emit('friend_list', friends);
                io.to(socket.id).emit('pending_list', pending);
                io.emit('users',users);
            }
        });
        
        
        socket.on('group message',function(msg){
            io.emit('group',msg);
        });
        
        socket.on('private message',function(msg){
            models.messages.create({
                "message":msg.split("#*@")[1],
                "sender" :msg.split("#*@")[2],
                "reciever":msg.split("#*@")[0],
                "date" : new Date()});
            io.to(users[msg.split("#*@")[0]]).emit('private message', msg);
        });
        
        socket.on('disconnect', function(){
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);
        });
    });
    
    app.post('/friend_request',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        friend=true;
        models.user.find({"handle" : req.body.my_handle,"friends.name":req.body.friend_handle},function(err,doc){
            if(err){res.json(err);}
            else if(doc.length!=0){
                res.send("Friend request already sent ");
            }
            else{
                models.user.update({
                    handle:req.body.my_handle
                },{
                    $push:{
                        friends:{
                            name: req.body.friend_handle,
                            status: "Pending"
                        }
                    }
                },{
                    upsert:true
                },function(err,doc){
                    if(err){res.json(err);}
                });
                io.to(users[req.body.friend_handle]).emit('message', req.body);
            }
        });
    });
    
    app.post('/friend_request/confirmed',function(req,res){
        if(req.body.confirm=="Yes"){
            models.user.find({
                "handle" : req.body.friend_handle,
                "friends.name":req.body.my_handle
            },function(err,doc){
                if(err){
                    res.json(err);
                }
                else if(doc.length!=0){
                    res.send("Friend request already accepted");
                }
                else{
                    models.user.update({
                        "handle":req.body.my_handle,
                        "friends.name":req.body.friend_handle
                    },{
                        '$set':{
                            "friends.$.status":"Friend"
                        }
                    },function(err,doc){
                        if(err){res.json(err);}
                        else{
                            io.to(users[req.body.friend_handle]).emit('friend', req.body.my_handle);
                            io.to(users[req.body.my_handle]).emit('friend', req.body.friend_handle);
                        }
                    });
                    models.user.update({
                        handle:req.body.friend_handle
                    },{
                        $push:{
                            friends:{
                                name: req.body.my_handle,
                                status: "Friend"
                            }
                        }
                    },{upsert:true},function(err,doc){
                        if(err){res.json(err);}
                    });
                }
            });
        }
        else{
            models.user.update({
                "handle":req.body.my_handle
            },{
                '$pull':{
                    'friends':{
                        "name":req.body.friend_handle,
                    }
                }
            },function(err,doc){
            if(err){res.json(err);}
            else{
                console.log("No");
            }
        });
        }
    });
    
}