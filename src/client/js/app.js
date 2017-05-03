angular.module('myapp', ['ngMaterial', 'ui.router', 'ngStorage']);

angular
    .module('myapp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state('login', {
                    url: '/',
                    views: {
                        'body': {
                            templateUrl: 'client/views/login.html',
                            controller: 'registerController'
                        }
                    }
                })
                .state('loggedin', {
                    url: '/login',
                    views: {
                        'body': {
                            templateUrl: 'client/views/chat.html',
                            controller: 'myController'
                        }
                    }
                })
        }
    ]);