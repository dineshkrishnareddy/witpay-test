angular
    .module('myapp')
    .service('encrypt', function () {
        this.hash = function (str) {
            h = 7;
            letters = "abcdefghijklmnopqrstuvwxyz-_1234567890@!#$%&*.,"
            for (var i = 0; i < str.length; i++) {
                h = (h * 37 + letters.indexOf(str[i]))
            }
            return h
        }
    });