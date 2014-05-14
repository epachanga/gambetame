angular.module('WorldCup', [
  'worldcup.controllers',
  'worldcup.directives',
  'worldcup.services',
  'worldcup.filters',
  'timer',
  'firebase',
  'ngResource',
  'ngRoute'
])
.config(
  ['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
      var resolveServices = {
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
      };

      $locationProvider.html5Mode(true);

      $routeProvider
        .when('/', {
          controller: 'HomeCtrl',
          templateUrl: '/views/home.html',
          resolve: {
            'MatchesData': function(Matches){
              return Matches.promise;
            }
          }
        })
        .when('/matches', {
          controller: 'MainCtrl',
          templateUrl: '/views/matches.html',
          resolve: resolveServices
        })
        .when('/groups', {
          controller: 'MainCtrl',
          templateUrl: '/views/groups.html',
          resolve: resolveServices
        })
        .otherwise({
          templateUrl: '/views/error.html'
        });
    }
  ]
);
