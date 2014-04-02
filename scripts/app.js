angular.module('WorldCup', [
  'worldcup.controllers',
  'worldcup.services',
  'ngRoute'
])
.config(
  ['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
      $locationProvider.html5Mode(true);

      $routeProvider
        .when('/', {
          controller: 'MainCtrl',
          templateUrl: '/views/main.html',
          resolve: {
            'GroundsData': function(Grounds){
              return Grounds.promise;
            },
            'TeamsData': function(Teams){
              return Teams.promise;
            },
            'GroupsData': function(Groups){
              return Groups.promise;
            },
            'MatchesData': function(Matches){
              return Matches.promise;
            }
          }
        })
        .otherwise({
          templateUrl: '/views/error.html',
        });
    }
  ]
);
