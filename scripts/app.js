angular.module('WorldCup', [
  'worldcup.controllers',
  'worldcup.directives',
  'worldcup.services',
  'worldcup.filters',
  'timer',
  'ga',
  'ngResource',
  'ngRoute'
])
.value('PARSE_APP_ID', 'QkPPikBb9pMTELRRuUJxZNJxTtsvaKDtqPnyqiRE')
.value('PARSE_CLIENT_KEY', 'tWIMPGxC3trQvzMxzLKyziza6w6YPAhWPTa9BYwD')
.value('FB_APP_ID', '1435795020006139')
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
          controller: 'MainCtrl',
          templateUrl: '/views/home.html',
          resolve: resolveServices
        })
        .when('/second-stage', {
          controller: 'MainCtrl',
          templateUrl: '/views/second-stage.html',
          resolve: resolveServices
        })
        .when('/groups', {
          controller: 'MainCtrl',
          templateUrl: '/views/groups.html',
          resolve: resolveServices
        })
        .when('/groups/:group', {
          controller: 'MainCtrl',
          templateUrl: '/views/group.html',
          resolve: resolveServices
        })
        .otherwise({
          templateUrl: '/views/error.html'
        });
    }
  ]
)
.run(
  ['$rootScope', '$window', 'PARSE_APP_ID', 'PARSE_CLIENT_KEY', 'FB_APP_ID',
    function($rootScope, $window, PARSE_APP_ID, PARSE_CLIENT_KEY, FB_APP_ID){
      $rootScope.currentUser = null;

      Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY);

      $window.fbAsyncInit = function(){
        Parse.FacebookUtils.init({
          appId      : FB_APP_ID, // Facebook App ID
          channelUrl : '//gambeta.me/channel.html', // Channel File
          status     : true, // check login status
          cookie     : true, // enable cookies to allow Parse to access the session
          xfbml      : true  // parse XFBML
        });

        FB.getLoginStatus(function(data) {
          if (data.status != 'connected') {
            Parse.User.logOut();
            $rootScope.currentUser = null;
          }
        });
      };

      (function(d){
        // load the Facebook javascript SDK

        var js,
        id = 'facebook-jssdk',
        ref = d.getElementsByTagName('script')[0];

        if (d.getElementById(id)) {
          return;
        }

        js = d.createElement('script');
        js.id = id;
        js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";

        ref.parentNode.insertBefore(js, ref);

      }(document));
    }
  ]
);
