angular
    .module('myapp')
    .controller('registerController', ['$scope', 'encrypt', '$http', '$state', function ($scope, encrypt, $http, $state) {
        var url = location.host;

        $scope.user = {
            'name': '',
            'handle': '',
            'password': ''
        };

        $scope.login_data = {
            'handle': '',
            'password': ''
        };

        $scope.Register = function () {
            $scope.user.password = encrypt.hash($scope.user.password);

            $http({method: 'POST', url: 'https://' + url + '/register', data: $scope.user})
                .success(function (data) {
                    console.log(data)
                })
                .error(function (data) {
                    console.log(data)
                });
        };

        $scope.login = function () {
            $scope.login_data.password = encrypt.hash($scope.login_data.password);
            $http({method: 'POST', url: 'https://' + url + '/login', data: $scope.login_data})
                .success(function (data) {
                    if (data == "success") {
                        $state.go('loggedin');
                    }
                })
                .error(function (data) {
                    console.log(data)
                });
        }
    }]);