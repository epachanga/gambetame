(function () {
  'use strict';

  var WorldCupCtrl = function($scope, $location, ga) {
    $scope.$root.currentUser = Parse.User.current();
    $scope.loading = false;
    $scope.$root.simpleMode = (localStorage.getItem('simpleMode') === 'true');

    $scope.$watch(function(){ return $location.path(); },
      function(newVal, oldVal){
        ga('send', 'pageview', {title: $location.path()});
      }
    );

    $scope.switchMode = function() {
      $scope.$root.simpleMode = !$scope.$root.simpleMode;
      localStorage.setItem('simpleMode', $scope.$root.simpleMode);
    };

    /*$scope.modeHelp = function($evt, mode) {
      $evt.stopPropagation();
      $evt.preventDefault();

      console.log('evme', mode);
    };*/

    $scope.login = function() {
      $scope.loading = true;
      Parse.FacebookUtils.logIn(
        'email,public_profile,user_friends,publish_actions', {
        success: function(user) {
          if (user.existed()) {
            $scope.$root.currentUser = user;
            $scope.loading = false;
            $scope.$apply();
            return;
          }
          FB.api('/me', function(me) {
            user.set('name', me.name);
            user.set('email', me.email);
            user.save().then(function(result) {
              $scope.$root.currentUser = result;
              $scope.loading = false;
              $scope.$apply();
            });
          });
        },
        error: function(user, error) {
          $scope.$root.currentUser = null;
          $scope.loading = false;
        }
      });
    }

    $scope.logout = function() {
      Parse.User.logOut();
      $scope.$root.currentUser = null;
    }
  };

  var TopNavCtrl = function($scope, $location) {
    $scope.selected = '';

    $scope.$watch(function(){ return $location.path(); },
      function(newVal, oldVal){
        $scope.selected = $location.path().split('/')[1];
      }
    );
  };

  var UserCtrl = function($scope) {

    var self = this;

    $scope.disabled = true;
    $scope.saving = false;

    $scope.save = function() {
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches),
      userMatches;

      $scope.saving = true;
      if (!$scope.$root.userMatches) {
        query.equalTo('userId', $scope.$root.currentUser.id);
        query.find().then(function(result){
          if (result.length) {
            userMatches = result[0];
          } else {
            userMatches = new UserMatches();
            userMatches.setACL(new Parse.ACL($scope.$root.currentUser));
            userMatches.set('userId', $scope.$root.currentUser.id);
          }
          self.saveMatches(userMatches);
        });
      } else {
        self.saveMatches($scope.$root.userMatches);
      }
    }

    $scope.$watch(
      function(){ return $scope.$root.matches },
      function(newVal, oldVal) {
        if (!_.isUndefined(newVal) && !_.isUndefined(oldVal)
                                                && !_.isEqual(newVal, oldVal)) {
          $scope.disabled = false;
        }
      },
      true
    );

    this.saveMatches = function(userMatches) {
      userMatches.set('matches', JSON.stringify($scope.$root.matches));
      userMatches.set('simpleMode', $scope.$root.simpleMode);
      userMatches.save().then(function(result) {
        $scope.$root.userMatches = result;
        $scope.disabled = true;
        $scope.saving = false;
        $scope.$apply();
      }, function() {
        $scope.disabled = true;
        $scope.saving = false;
      });
    }
  };

  var MainCtrl = function ($scope, $route, Groups) {
    $scope.$root.matches = $route.current.locals.MatchesData;
    $scope.$root.teams = $route.current.locals.TeamsData;
    $scope.$root.grounds = $route.current.locals.GroundsData;
    $scope.$root.groups = $route.current.locals.GroupsData;

    $scope.$root.buildStandings = Groups.buildStandings;

    _.forEach($scope.$root.groups, function(data, group) {
      $scope.$root.buildStandings(group);
    });

    angular.element(document).ready(function() {
      $('[data-toggle~="tooltip"]').tooltip();
    });

    if ($scope.$root.currentUser) {
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches);

      query.equalTo('userId', $scope.$root.currentUser.id);
      query.find().then(function(result){
        if (result.length) {
          var matches = JSON.parse(result[0].get('matches'));
          _.forEach(matches, function(match){
            var $match =_.find($scope.$root.matches, {id: match.id});
            $match.teams.home.goals = match.teams.home.goals;
            $match.teams.away.goals = match.teams.away.goals;
          });
          _.forEach($scope.$root.groups, function(data, group) {
            $scope.$root.buildStandings(group);
          });
          $scope.$apply();
        }
      });
    }
  };

  var MatchesCtrl = function ($scope) {
    $scope.matches = _.groupBy($scope.$root.matches, 'stage');
    _.forEach($scope.matches, function(matches, stage) {
      $scope[stage.replace(/[\s-]/g, '')] = _.groupBy(matches, function(match){
        return match.date.getDate() + '/' + parseInt(match.date.getMonth()+1);
      });
    });
  };

  var GroupCtrl = function($scope, $routeParams) {
    $scope.group = $routeParams.group;
  };

  var HomeCtrl = function($scope) {
    var firstMatch = _.find($scope.$root.matches, {id: 1});
    $scope.startTime = firstMatch.date.getTime();
  };

  angular.module('worldcup.controllers', [])
    .controller('WorldCupCtrl', ['$scope', '$location', 'ga', WorldCupCtrl])
    .controller('MainCtrl', ['$scope', '$route', 'Groups', 'Matches', MainCtrl])
    .controller('TopNavCtrl', ['$scope', '$location', TopNavCtrl])
    .controller('HomeCtrl', ['$scope', HomeCtrl])
    .controller('GroupCtrl', ['$scope', '$routeParams', GroupCtrl])
    .controller('MatchesCtrl', ['$scope', MatchesCtrl])
    .controller('UserCtrl', ['$scope', UserCtrl])
    ;
})();
