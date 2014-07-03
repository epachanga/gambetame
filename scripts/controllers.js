(function () {
  'use strict';

  var MainCtrl = function ($scope, $route, $routeParams, $window, $location, ga, Groups, Utils) {
    var self = this;

    if ($location.search().request_ids) {
      $window.location.href = '/groupings';
    }

    $scope.page = $location.path().split('/')[1] || 'home';
    $scope.loading = false;
    $scope.mainLoading = true;
    $scope.disabled = true;
    $scope.saving = false;
    $scope.routeParams = $routeParams;
    $scope.viewTemplate = '/views/templates/page/' + $scope.page + '.html';
    $scope.modalOpen = false;
    $scope.groupingName = null;
    $scope.error = null;
    $scope.currentDate = (new Date()).getTime();

    $scope.$root.currentUser = Parse.User.current();
    $scope.$root.simpleMode = (localStorage.getItem('simpleMode') === 'true');
    $scope.$root.viewMode = false;
    $scope.$root.matches = angular.copy(_.sortBy($route.current.locals.MatchesData, 'date'));
    $scope.$root.teams = $route.current.locals.TeamsData;
    $scope.$root.grounds = $route.current.locals.GroundsData;
    $scope.$root.groups = $route.current.locals.GroupsData;

    $scope.$root.buildStandings = Groups.buildStandings;
    _.forEach($scope.$root.groups, function(data, group) {
      $scope.$root.buildStandings(group);
      Groups.buildRealStandings(group);
      data.real_standings = Utils.orderStandings(data.real_standings);
    });

    var nextMatchIndex = _.findIndex($scope.$root.matches, function(match) {
      return match.date.getTime() > $scope.currentDate;
    });
    var
    nextMatch = $scope.$root.matches[nextMatchIndex],
    currentStage = nextMatch.stage.replace(/[\s-]/g, '');

    $scope.currentStage = currentStage;

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

    $scope.login = function() {
      var
      href = $location.search().redirect || $location.path();
      $scope.loading = true;
      Parse.FacebookUtils.logIn(
        'email,public_profile,user_friends,publish_actions', {
        success: function(user) {
          if (user.existed() && user.getEmail()) {
            $window.location.href = href;
            return;
          }
          FB.api('/me', function(me) {
            user.set('name', me.name);
            user.setEmail(me.email);
            user.save().then(function(result) {
              $window.location.href = href;
              return;
            });
          });
        },
        error: function(user, error) {
          console.log('evme', user, error);
          $scope.$root.currentUser = null;
          $scope.loading = false;
          $scope.$apply();
        }
      });
    };

    $scope.logout = function() {
      $scope.mainLoading = true;
      $scope.$root.currentUser = Parse.User.logOut();
      $window.location.href = '/';
    };

    $scope.save = function() {
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches),
      userMatches;

      $scope.saving = true;
      if (!$scope.$root.userMatches) {
        query.equalTo('userId', $scope.$root.currentUser.id);
        query.include('user');
        query.find().then(function(result){
          if (result.length) {
            userMatches = result[0];
          } else {
            userMatches = new UserMatches();
            var UserMatchesACL = new Parse.ACL($scope.$root.currentUser);

            UserMatchesACL.setPublicReadAccess(true);
            userMatches.setACL(UserMatchesACL);
            userMatches.set('userId', $scope.$root.currentUser.id);
            userMatches.set('user', $scope.$root.currentUser);
          }
          self.saveMatches(userMatches, currentStage);
        });
      } else {
        self.saveMatches($scope.$root.userMatches, currentStage);
      }
    };

    $scope.redirectHome = function() {
      $location.search('redirect', $location.path());
      $location.path('/');
    };

    $scope.loaded = function() {
      $scope.mainLoading = false;
    };

    $scope.openModal = function(modalTitle, modalAction) {
      $scope.modalTitle = modalTitle;
      $scope.modalAction = modalAction;
      $scope.modalOpen = true;

      $('#groupingModal').modal({
        backdrop: 'static',
        keyboard: false
      });
    };

    $scope.closeModal = function() {
      $scope.modalOpen = false;
      $scope.groupingName = null;
    };

    $scope.go = function(action) {
      $scope.error = null;
      if (!$scope.groupingName) {
        $scope.error = 'You must enter a name for the group.';
        return;
      }

      $scope.loading = true;

      var
      Groupings = Parse.Object.extend('Groupings'),
      query = new Parse.Query(Groupings);
      query.equalTo('name', $scope.groupingName);
      query.find().then(function(result){
        console.log('evme', result);
        if (action.toLowerCase() == 'create') {
          if (result.length) {
            $scope.error = 'A group with the same name already exists.';
            $scope.loading = false;
            $scope.$apply();
          } else {
            // create grouping
            var
            Grouping = new Groupings(),
            GroupingACL = new Parse.ACL($scope.$root.currentUser);

            Grouping.set('name', $scope.groupingName);
            Grouping.set('adminUser', $scope.$root.currentUser);
            GroupingACL.setPublicReadAccess(true);
            Grouping.setACL(GroupingACL);

            Grouping.save().then(function(result) {
              var
              groupingId = result.id,
              UserGroupings = Parse.Object.extend('UserGroupings'),
              UserGrouping = new UserGroupings();

              UserGrouping.set('user', $scope.$root.currentUser);
              UserGrouping.set('grouping', result);
              UserGrouping.set('isAdmin', true);
              UserGrouping.set('status', 'joined');
              UserGrouping.save().then(function() {
                $window.location.href = '/groupings/' + groupingId;
                return;
              }, function() {
                $scope.loading = false;
                $scope.$apply();
              });
            }, function() {
              $scope.loading = false;
              $scope.$apply();
            });
          }
        } else if (action.toLowerCase() == 'join') {
          if (!result.length) {
            $scope.error = 'We can\'t find a group with that name.';
            $scope.loading = false;
            $scope.$apply();
            return;
          }
          if (result[0].get('adminUser').id == $scope.currentUser.id) {
            $scope.error = 'You can\'t join your own group.';
            $scope.loading = false;
            $scope.$apply();
            return;
          }
          $scope.joinGrouping(result[0]);
        }
      });
    };

    $scope.joinGrouping = function(grouping) {
      var
      UserGroupings = Parse.Object.extend('UserGroupings'),
      UserGrouping = new UserGroupings();

      UserGrouping.set('user', $scope.$root.currentUser);
      UserGrouping.set('grouping', grouping);
      UserGrouping.set('isAdmin', false);
      UserGrouping.set('status', 'joined');
      UserGrouping.save().then(function() {
        $window.location.href = '/groupings/' + grouping.id;
        return;
      });
    };

    $scope.inviteFriends = function(groupId) {
      var
      Groupings = Parse.Object.extend('Groupings'),
      query = new Parse.Query(Groupings);

      query.equalTo('objectId', groupId);
      query.find().then(function(result){
        if (result.length) {
          FB.ui({method: 'apprequests',
            message: 'Come guess the world cup scores with me.'
          }, function(requestResult) {
            var InviteRequests = Parse.Object.extend('InviteRequests');
            _.forEach(requestResult.to, function(invitedUser) {
              var InviteRequest = new InviteRequests();

              InviteRequest.set('requestId', requestResult.request);
              InviteRequest.set('invitee', invitedUser);
              InviteRequest.set('grouping', result[0]);
              InviteRequest.save().then(function(){});
            });
          });
        }
      });
    };

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

    this.saveMatches = function(userMatches, currentStage) {
      var matches = JSON.stringify($scope.$root.matches);

      userMatches.set('matches', matches);
      userMatches.set(currentStage, matches);
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

  var UserCtrl = function($scope) {};

  var KnockoutRoundCtrl = function ($scope, Utils) {
    if ($scope.$root.currentUser) {
      // query user matches
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches);

      query.include('user');
      query.equalTo('userId', $scope.$root.currentUser.id);
      query.find().then(function(result){
        if (result.length) {
          Utils.loadUserMatches(result[0], $scope.currentStage);
          _.forEach($scope.$root.groups, function(data, group) {
            $scope.$root.buildStandings(group);
          });
        }

        $scope.matches = _.groupBy($scope.$root.matches, 'stage');
        _.forEach($scope.matches, function(matches, stage) {
          $scope[stage.replace(/[\s-]/g, '')] = matches;
        });

        $scope.loaded();
        $scope.$apply();
      });
    } else {
      $scope.matches = _.groupBy($scope.$root.matches, 'stage');
      _.forEach($scope.matches, function(matches, stage) {
        $scope[stage.replace(/[\s-]/g, '')] = matches;
      });

      $scope.loaded();
    }
  };

  var GroupCtrl = function($scope, Utils) {
    $scope.group = $scope.routeParams.group;

    if ($scope.$root.currentUser) {
      // query user matches
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches);

      query.include('user');
      query.equalTo('userId', $scope.$root.currentUser.id);
      query.find().then(function(result){
        if (result.length) {
          Utils.loadUserMatches(result[0], $scope.currentStage);

          if (!$scope.group || $scope.group == 'all') {
            _.forEach($scope.$root.groups, function(data, group) {
              $scope.$root.buildStandings(group);
            });
          } else {
            $scope.$root.buildStandings($scope.group);
          }

          $scope.loaded();
          $scope.$apply();
        }
      });
    } else {
      if (!$scope.group || $scope.group == 'all') {
        _.forEach($scope.$root.groups, function(data, group) {
          $scope.$root.buildStandings(group);
        });
      } else {
        $scope.$root.buildStandings($scope.group);
      }

      $scope.loaded();
    }
  };

  var HomeCtrl = function($scope, $window, Utils) {
    $scope.nextMatches = [];

    if ($scope.$root.currentUser) {
      // query user matches
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches);

      query.include('user');
      query.equalTo('userId', $scope.$root.currentUser.id);
      query.find().then(function(result){
        if (result.length) {
          Utils.loadUserMatches(result[0], $scope.currentStage);

          var nextMatchIndex = _.findIndex($scope.$root.matches, function(match) {
            return match.date.getTime() > $scope.currentDate;
          });

          var nextMatch = $scope.$root.matches[nextMatchIndex];
          $scope.nextMatches.push(nextMatch);
          while ($scope.$root.matches[nextMatchIndex++] && $scope.$root.matches[nextMatchIndex].stage == nextMatch.stage) {
            $scope.nextMatches.push($scope.$root.matches[nextMatchIndex]);
          }
          /*var addMatches = $scope.nextMatches.length;
          for (var i=0; i<addMatches; i++) {
            $scope.nextMatches.push($scope.$root.matches[nextMatchIndex++]);
          }*/

          $scope.loaded();
          $scope.$apply();
        }
      });
    } else {
      var nextMatchIndex = _.findIndex($scope.$root.matches, function(match) {
        return match.date.getTime() > $scope.currentDate;
      });

      var nextMatch = $scope.$root.matches[nextMatchIndex];
      $scope.nextMatches.push(nextMatch);
      while ($scope.$root.matches[nextMatchIndex++] && $scope.$root.matches[nextMatchIndex].stage == nextMatch.stage) {
        $scope.nextMatches.push($scope.$root.matches[nextMatchIndex]);
      }
      /*var addMatches = $scope.nextMatches.length;
      for (var i=0; i<addMatches; i++) {
        $scope.nextMatches.push($scope.$root.matches[nextMatchIndex++]);
      }*/

      $scope.loaded();
    }
  };

  var GroupingCtrl = function($scope, $location) {
    if (!$scope.$root.currentUser) {
      $scope.redirectHome();
      return;
    }
    if (!$scope.routeParams.id) {
      $scope.groupingTemplate = '/views/templates/groupingList.html';

      var
      UserGroupings = Parse.Object.extend('UserGroupings'),
      query = new Parse.Query(UserGroupings);

      query.equalTo('user', $scope.$root.currentUser);
      query.include('grouping');
      query.find().then(function(results){
        $scope.userGroupings = results;

        var
        InviteRequests = Parse.Object.extend('InviteRequests'),
        query = new Parse.Query('InviteRequests');

        query.equalTo('invitee', $scope.$root.currentUser.get('authData').facebook.id);
        query.include('grouping');
        query.find().then(function(results) {
          $scope.invitedGroups = [];
          _.forEach(results, function(invitedGroup) {
            var joined = _.find($scope.userGroupings, function(userGroup){
              return invitedGroup.get('grouping').id == userGroup.get('grouping').id;
            });
            if (!joined) {
              $scope.invitedGroups.push(invitedGroup);
            }
          });
          $scope.loaded();
          $scope.$apply();
        });
      });
    } else {
      var
      Groupings = Parse.Object.extend('Groupings'),
      query = new Parse.Query(Groupings);

      query.equalTo('objectId', $scope.routeParams.id);
      query.find().then(function(result){
        if (result.length) {
          $scope.groupingTemplate = '/views/templates/groupingView.html';
          $scope.grouping = result[0];

          var
          UserGroupings = Parse.Object.extend('UserGroupings'),
          query = new Parse.Query(UserGroupings);

          query.equalTo('grouping', $scope.grouping);
          query.include('user');
          query.find().then(function(results) {
            $scope.groupingUsers = results;

            $scope.userJoined = false;
            if (_.find($scope.groupingUsers, function(groupUser){
              return groupUser.get('user').id == $scope.$root.currentUser.id;
            })) {
              $scope.userJoined = true;
            }

            $scope.loaded();
            $scope.$apply();
          });
        } else {
          $scope.groupingTemplate = '/views/templates/groupingError.html';
          $scope.loaded();
          $scope.$apply();
        }
      });
    }
  };

  var ResultsCtrl = function($scope, Utils) {
    var userId = $scope.routeParams.id;

    if ($scope.$root.currentUser.id == userId) {
      $scope.loaded();
      return;
    }

    $scope.mainLoading = true;

    var
    UserMatches = Parse.Object.extend('UserMatches'),
    query = new Parse.Query(UserMatches);
    query.equalTo('userId', userId);
    query.include('user', userId);
    query.find().then(function(result){
      if (result.length) {
        Utils.loadUserMatches(result[0], $scope.currentStage);

        _.forEach($scope.$root.groups, function(data, group) {
          $scope.$root.buildStandings(group);
        });

        var matches = _.groupBy($scope.$root.matches, 'stage');
        _.forEach(matches, function(matches, stage) {
          $scope[stage.replace(/[\s-]/g, '')] = matches;
        });

        $scope.$root.viewMode = true;
        $scope.user = result[0].get('user');
        $scope.loaded();
        $scope.$apply();
      } else {
        $scope.error = "User has not entered any results";
        $scope.loaded();
        $scope.$apply();
      }
    });
  };

  var ServicesCtrl = function ($scope, $window) {
    console.group('Update User Scores');
    var currentUser = Parse.User.current();
    if (!currentUser || currentUser.get('authData').facebook.id != '10152131672672532') {
      $window.location.href = '/';
    }

    $scope.process = 0;

    var
    stages = ['GroupStage', 'Roundof16', 'QuarterFinals', 'SemiFinals', 'PlayoffForThirdPlace', 'Final'],
    UserMatches = Parse.Object.extend('UserMatches'),
    query = new Parse.Query(UserMatches);
    query.include('user');

    query.find().then(function(usersMatches) {
      $scope.limit = usersMatches.length;
      var
      UserScores = Parse.Object.extend('UserScores');

      usersMatches.forEach(function(userMatches) {
        var scoreQuery = new Parse.Query(UserScores);
        scoreQuery.equalTo('user', userMatches.get('user'));
        scoreQuery.find().then(function(userScore) {
          console.groupCollapsed('Update ' + userMatches.get('user').get('name') + ' Score');

          if (!userScore.length) {
            var userScore = new UserScores();
            userScore.set('user', userMatches.get('user'));
          } else {
            userScore = userScore[0];
          }

          stages.forEach(function(stage){
            console.groupCollapsed('Calculate ' + stage + ' score');
            var
            stageScore = 0,
            matches = userMatches.get(stage) ? JSON.parse(userMatches.get(stage)) : [];

            matches.forEach(function(match) {
              var
              realMatch = _.find($scope.$root.matches, {id: match.id}),
              matchScore = 0,
              matchStage = match.stage.replace(/[\s-]/g, '');
              console.groupCollapsed('Process match ' + match.id + ' (' + realMatch.teams.home.team + ' - ' + realMatch.teams.away.team + ') score');

              console.log('match', match);
              console.log('home team', realMatch.teams.home.team);
              console.log('away team', realMatch.teams.away.team);

              if (matchStage == stage && !_.isNull(realMatch.teams.home.real_goals) && !_.isNull(realMatch.teams.away.real_goals) && !_.isNull(match.teams.home.goals) && !_.isNull(match.teams.away.goals)) {
                var
                realWinner = null,
                userWinner = null,
                realTie = null,
                userTie = null,
                realHomeGoals = realMatch.teams.home.real_goals,
                realAwayGoals = realMatch.teams.away.real_goals,
                realHomePenalty = realMatch.teams.home.real_penalty,
                realAwayPenalty = realMatch.teams.away.real_penalty,
                userHomeGoals = match.teams.home.goals,
                userAwayGoals = match.teams.away.goals,
                userHomePenalty = match.teams.home.penalty,
                userAwayPenalty = match.teams.away.penalty;

                console.log('real home goals', realHomeGoals);
                console.log('real away goals', realAwayGoals);
                console.log('real home penalty', realHomePenalty);
                console.log('real away penalty', realAwayPenalty);
                console.log('user home goals', userHomeGoals);
                console.log('user away goals', userAwayGoals);
                console.log('user home penalty', userHomePenalty);
                console.log('user away penalty', userAwayPenalty);

                if (realHomeGoals == userHomeGoals) {
                  console.log('+1 guess exact team goals', match.teams.home.team, userHomeGoals);
                  matchScore += 1;
                  if (realHomeGoals > 4) {
                    console.log('+1 guess exact team goals > 4', match.teams.home.team, userHomeGoals);
                    matchScore += 1;
                  }
                }
                if (realAwayGoals == userAwayGoals) {
                  console.log('+1 guess exact team goals', match.teams.away.team, userAwayGoals);
                  matchScore += 1;
                  if (realAwayGoals > 4) {
                    console.log('+1 guess exact team goals > 4', match.teams.away.team, userAwayGoals);
                    matchScore += 1;
                  }
                }

                if (match.stage == 'Group Stage') {
                  if (realHomeGoals > realAwayGoals) {
                    realWinner = match.teams.home.team;
                  } else if (realAwayGoals > realHomeGoals) {
                    realWinner = match.teams.away.team;
                  } else {
                    realTie = true;
                  }

                  if (userHomeGoals > userAwayGoals) {
                    userWinner = match.teams.home.team;
                  } else if (userAwayGoals > userHomeGoals) {
                    userWinner = match.teams.away.team;
                  } else {
                    userTie = true;
                  }
                } else {
                  if (realHomeGoals > realAwayGoals || realHomePenalty) {
                    realWinner = match.teams.home.team;
                  } else {
                    realWinner = match.teams.away.team;
                  }

                  if (userHomeGoals > userAwayGoals || userHomePenalty) {
                    userWinner = match.teams.home.team;
                  } else {
                    userWinner = match.teams.away.team;
                  }
                }

                if (!_.isNull(realWinner) && realWinner == userWinner) {
                  console.log('+2 guess correct winner', userWinner);
                  matchScore += 2;
                }
                if (!_.isNull(realTie) && realTie === userTie) {
                  console.log('+2 guess tie');
                  matchScore += 2;
                }
              } else {
                console.log('skipped match processing');
                console.assert(matchStage == stage, 'matchStage == stage');
                console.assert(!_.isNull(realMatch.teams.home.real_goals), '!_.isNull(realMatch.teams.home.real_goals)');
                console.assert(!_.isNull(realMatch.teams.away.real_goals), '!_.isNull(realMatch.teams.away.real_goals)');
                console.assert(!_.isNull(match.teams.home.goals), '!_.isNull(match.teams.home.goals)');
                console.assert(!_.isNull(match.teams.away.goals), '!_.isNull(match.teams.away.goals)');
              }
              console.log('total match score:', matchScore);
              stageScore += matchScore;
              console.groupEnd();
            });
            console.log('total stage score:', stageScore);
            console.groupEnd();
            userScore.set(stage, stageScore);
          });

          userScore.save();

          console.groupEnd();

          $scope.process++;
          $scope.$apply();
        });
      });

    });

    $scope.$watch('process', function(newVal) {
      if (newVal === $scope.limit) {
        $scope.loaded();
      }
    });
  };

  angular.module('worldcup.controllers', [])
    .controller('MainCtrl', ['$scope', '$route', '$routeParams', '$window', '$location', 'ga', 'Groups', 'Utils', MainCtrl])
    .controller('HomeCtrl', ['$scope', '$window', 'Utils', HomeCtrl])
    .controller('GroupCtrl', ['$scope', 'Utils', GroupCtrl])
    .controller('KnockoutRoundCtrl', ['$scope', 'Utils', KnockoutRoundCtrl])
    .controller('UserCtrl', ['$scope', UserCtrl])
    .controller('GroupingCtrl', ['$scope', GroupingCtrl])
    .controller('ResultsCtrl', ['$scope', 'Utils', ResultsCtrl])
    .controller('ServicesCtrl', ['$scope', '$window', ServicesCtrl])
    ;
})();
