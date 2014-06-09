(function () {
  'use strict';

  var MainCtrl = function ($scope, $route, $routeParams, $window, $location, ga, Groups) {
    $scope.page = $location.path().split('/')[1] || 'home';
    $scope.loading = false;

    $scope.$root.currentUser = Parse.User.current();
    $scope.$root.simpleMode = (localStorage.getItem('simpleMode') === 'true');

    $scope.$watch(function(){ return $location.path(); },
      function(newVal, oldVal){
        if (newVal != oldVal) {
          $scope.page = $location.path().split('/')[1] || 'home';
          ga('send', 'pageview', {title: $location.path()});
        }
      }
    );

    $scope.switchMode = function() {
      $scope.$root.simpleMode = !$scope.$root.simpleMode;
      localStorage.setItem('simpleMode', $scope.$root.simpleMode);
    };

    if($scope.page != 'home' && !$scope.currentUser) {
      $location.path('/');
      return;
    }
    $scope.$root.matches = $route.current.locals.MatchesData;
    $scope.$root.teams = $route.current.locals.TeamsData;
    $scope.$root.grounds = $route.current.locals.GroundsData;
    $scope.$root.groups = $route.current.locals.GroupsData;

    $scope.$root.buildStandings = Groups.buildStandings;

    _.forEach($scope.$root.groups, function(data, group) {
      $scope.$root.buildStandings(group);
    });

    var firstMatch = _.find($scope.$root.matches, {id: 1});
    $scope.startTime = firstMatch.date.getTime();

    $scope.routeParams = $routeParams;
    $scope.viewTemplate = '/views/templates/page/' + $scope.page + '.html';

    if ($scope.$root.currentUser) {
      // query user matches
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
            $match.teams.home.penalty = match.teams.home.penalty;
            $match.teams.away.penalty = match.teams.away.penalty;
          });
          _.forEach($scope.$root.groups, function(data, group) {
            $scope.$root.buildStandings(group);
          });
          $scope.$apply();
        }
      });
    }

    $scope.login = function() {
      $scope.loading = true;
      Parse.FacebookUtils.logIn(
        'email,public_profile,user_friends,publish_actions', {
        success: function(user) {
          if (user.existed() && user.getEmail()) {
            $window.location.reload();
            return;
          }
          FB.api('/me', function(me) {
            user.set('name', me.name);
            user.setEmail(me.email);
            user.save().then(function(result) {
              $window.location.reload();
            });
          });
        },
        error: function(user, error) {
          $scope.$root.currentUser = null;
          $scope.loading = false;
          $scope.$apply();
        }
      });
    }

    $scope.logout = function() {
      $scope.$root.currentUser = Parse.User.logOut();
      $window.location.reload();
    }
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

  var SecondStageCtrl = function ($scope) {
    $scope.matches = _.groupBy($scope.$root.matches, 'stage');
    _.forEach($scope.matches, function(matches, stage) {
      $scope[stage.replace(/[\s-]/g, '')] = matches;
    });
  };

  var GroupCtrl = function($scope) {
    $scope.group = $scope.routeParams.group;

    if ($scope.group == 'all') {
      $scope.next = '/second-stage';
    } else {
      var
      current = null,
      next = null;
      for (var i in $scope.$root.groups) {
        if (current) {
          next = '/groups/' + i;
          break;
        }
        if (i == $scope.group) {
          current = true;
        }
      }
      $scope.next = next || '/second-stage';
    }
  };

  var HomeCtrl = function($scope) {
    // $scope.$root.currentUser = true;
  };

  angular.module('worldcup.controllers', [])
    .controller('MainCtrl', ['$scope', '$route', '$routeParams', '$window', '$location', 'ga', 'Groups', MainCtrl])
    .controller('HomeCtrl', ['$scope', HomeCtrl])
    .controller('GroupCtrl', ['$scope', GroupCtrl])
    .controller('SecondStageCtrl', ['$scope', SecondStageCtrl])
    .controller('UserCtrl', ['$scope', UserCtrl])
    ;
})();
