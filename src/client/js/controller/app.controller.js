angular
    .module('myapp')
    .controller('myController', ['$scope', 'socket', '$http', '$mdDialog', '$compile', '$location', '$state', '$localStorage', '$sessionStorage', function ($scope, socket, $http, $mdDialog, $compile, $location, $state, $localStorage, $sessionStorage) {
    var url = location.host;
    $scope.users = [];
    $scope.online_friends = [];
    $scope.allfriends = [];
    $scope.messages = {};
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var popups = [];

    socket.on('handle', function (data) {
        $scope.user = data;
    });


    socket.on('friend_list', function (data) {
        $scope.$apply(function () {
            $scope.allfriends.push.apply($scope.allfriends, data);
        });
    });

    socket.on('pending_list', function (data) {

    });

    socket.on('users', function (data) {
        $scope.$apply(function () {
            $scope.users = [];
            $scope.online_friends = [];
            for (var i in data) {
                if (i != $scope.user) {
                    if ($scope.allfriends.includes(i)) {
                        $scope.online_friends.push(i);
                    }
                    else {
                        $scope.users.push(i);
                    }

                }
            }
        });
    });

    $scope.confirm = function () {
        var data = {
            "friend_handle": $scope.friend,
            "my_handle": $scope.user
        };


        $http({method: 'POST', url: 'http://' + url + '/friend_request', data: data})
            .success(function (data) {
                console.log(data)
            })
            .error(function (data) {
                console.log(data)
            });
    };

    $scope.showConfirm = function (data) {
        var confirm = $mdDialog.confirm()
            .title(" connection request ")
            .textContent(data.my_handle + ' wants to connect.Do you want to Connect?')
            .ariaLabel('Lucky day')
            .ok('Ok')
            .cancel('No');

        $mdDialog.show(confirm).then(function () {
            data['confirm'] = "Yes";
            $http({
                method: 'POST', url: 'http://' + url + '/friend_request/confirmed', data: data
            })
        }, function () {
            data['confirm'] = "No";

            $http({
                method: 'POST', url: 'http://' + url + '/friend_request/confirmed', data: data
            })
        });
    };

    socket.on('message', function (data) {
        $scope.showConfirm(data);
    });

    socket.on('friend', function (data) {
        $scope.$apply(function () {
            if (!$scope.online_friends.includes(data)) {
                console.log(data);
                $scope.online_friends.push(data);
                $scope.users.splice($scope.users.indexOf(data), 1);
            }

        });
    });

    $scope.friend_request = function (user) {
        $scope.friend = user;
    };

    var getDate = function () {
        var date = new Date(),
        hour = date.getHours(),
        period = "AM",
        form_date;
        if (hour > 12) {
            hour = hour % 12;
            period = "PM";
        }
        form_date = monthNames[date.getMonth()] + " " + date.getDate() + ", " + hour + ":" + date.getMinutes() + " " + period;
        return form_date;
    };


    socket.on('group', function (data) {
        var div = document.createElement('div');
        if (data.split("#*@")[1] != $scope.user) {
            div.innerHTML = '<div class="direct-chat-msg right">\
                            <div class="direct-chat-info clearfix">\
                            <span class="direct-chat-name pull-right">' + data.split("#*@")[1] + '</span>\
                            <span class="direct-chat-timestamp pull-left">' + getDate() + '</span>\
                            </div>\
                            <div class="direct-chat-text">'
                + data.split("#*@")[0] +
                '</div>\
                </div>';
            document.getElementById("group").appendChild(div);
            document.getElementById("group").scrollTop = document.getElementById("group").scrollHeight;
        }
    });

    $scope.group_message = function (message) {
        var div = document.createElement('div');
        div.innerHTML = '<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">' + $scope.user + '</span>\
                        <span class="direct-chat-timestamp pull-right">' + getDate() + '</span>\
                        </div>\
                        <div class="direct-chat-text">'
            + message +
            '</div>\
            </div>';
        document.getElementById("group").appendChild(div);
        document.getElementById("group").scrollTop = document.getElementById("group").scrollHeight;
        socket.emit('group message', message + "#*@" + $scope.user);
        $scope.groupMessage = null;
    };

    var insertMessage = function (from, to, msg) {
        if (to in $scope.messages) {
            if ($scope.messages[to].length > 25) {
                $scope.messages[to].splice(0, 1);
            }
        }
        else {
            $scope.messages[to] = [];
        }
        $scope.messages[to].push({
            "sender": from,
            "msg": msg,
            "date": getDate()
        });
        localStorage.setItem(to, JSON.stringify($scope.messages[to]));
        localStorage.setItem(from, JSON.stringify($scope.messages[from]));
    };

    socket.on('private message', function (data) {
        var div = document.createElement('div');
        div.innerHTML = '<div class="direct-chat-msg right">\
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-right    ">' + data.split("#*@")[2] + '</span>\
                        <span class="direct-chat-timestamp pull-left">' + getDate() + '</span>\
                        </div>\
                        <div class="direct-chat-text">'
            + data.split("#*@")[1] +
            '</div>\
            </div>';
        var chat_box = document.getElementById(data.split("#*@")[2]);
        if (chat_box != null) {
            chat_box.appendChild(div);
        }
        else {
            $scope.chat_popup(data.split("#*@")[2]);
            document.getElementById(data.split("#*@")[2]).appendChild(div);
        }
        insertMessage(data.split("#*@")[2], data.split("#*@")[2], data.split("#*@")[1]);
        document.getElementById(data.split("#*@")[2]).scrollTop = document.getElementById(data.split("#*@")[2]).scrollHeight;
    });

    $scope.send_message = function (chat, message) {
        var div = document.createElement('div');
        div.innerHTML = '<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">' + $scope.user + '</span>\
                        <span class="direct-chat-timestamp pull-right">' + getDate() + '</span>\
                        </div>\
                        <div class="direct-chat-text">'
            + message +
            '</div>\
            </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop = document.getElementById(chat).scrollHeight;
        socket.emit('private message', chat + "#*@" + message + "#*@" + $scope.user + "#*@" + getDate());
        insertMessage($scope.user, chat, message);
        $scope.message = null;
    };

    $scope.chat_popup = function (chat_friend) {
        for (var i = 0; i < popups.length; i++) {
            if (chat_friend == popups[i]) {
                return
            }
        }

        var div = document.createElement('div');
        div.innerHTML = '<div class="popup-box popup-box-on chat-popup" id="' + chat_friend + '01">\
                        <div class="popup-head">\
                        <div class="popup-head-left pull-left">' + chat_friend + '</div>\
                        <div class="popup-head-right pull-right">\
                        <button  ng-click="close_chat(\'' + chat_friend + '\')" class="chat-header-button pull-right" type="button">  <i class="glyphicon glyphicon-remove"></i></button>\
                        </div>\
                        </div>\
                        <div class="box-body popup-messages">\
                        <div class="direct-chat-messages" id="' + chat_friend + '" >\
                        </div>\
                        </div>\
                        <div class="popup-messages-footer">\
                        <textarea id="status_message" placeholder="Type a message..." rows="10" cols="40" ng-model="message" my-enter="send_message(\'' + chat_friend + '\',\'{{message}}\')"></textarea>\
                        </div>\
                        </div>';
        $compile(div)($scope);


        if (popups.length > 1) {
            document.getElementById(chat_friend + "01").className = document.getElementById(popups[popups.length - 2] + "01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g, '');
        }
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(div);
        if (localStorage.getItem(chat_friend) !== null) {
            $scope.messages[chat_friend] = JSON.parse(localStorage.getItem(chat_friend));
        }
        if ($scope.messages[chat_friend] != undefined) {
            for (var i = 0; i < $scope.messages[chat_friend].length; i++) {
                if ($scope.messages[chat_friend][i].sender == $scope.user) {
                    div = document.createElement('div');
                    div.innerHTML = '<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">' + $scope.messages[chat_friend][i].sender + '</span>\
                        <span class="direct-chat-timestamp pull-right">' + $scope.messages[chat_friend][i].date + '</span>\
                        </div>\
                        <div class="direct-chat-text">'
                        + $scope.messages[chat_friend][i].msg +
                        '</div>\
                    </div>';
                    document.getElementById(chat_friend).appendChild(div);
                    document.getElementById(chat_friend).scrollTop = document.getElementById(chat_friend).scrollHeight;
                }
                else {
                    div = document.createElement('div');
                    div.innerHTML = '<div class="direct-chat-msg right">\
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-right    ">' + $scope.messages[chat_friend][i].sender + '</span>\
                        <span class="direct-chat-timestamp pull-left">' + $scope.messages[chat_friend][i].date + '</span>\
                        </div>\
                        <div class="direct-chat-text">'
                        + $scope.messages[chat_friend][i].msg +
                        '</div>\
                    </div>';
                    document.getElementById(chat_friend).appendChild(div);
                    document.getElementById(chat_friend).scrollTop = document.getElementById(chat_friend).scrollHeight;
                }
            }
        }
        popups.push(chat_friend);

    };

    $scope.close_chat = function (chat_friend) {
        chat_box = null;

        for (var i = 0; i < popups.length; i++) {
            if (chat_friend == popups[i]) {
                var chat_box = document.getElementById(popups[popups.length - 1] + "01");
                chat_box.parentElement.removeChild(chat_box);
                popups.splice(i, 1);
            }
        }
    };
}]);