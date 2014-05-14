angular.module('worldcup.filters', [])
  .filter('orderStandings', function() {
    return function(standings) {
      return standings.sort(function(a, b) {
        if (a.pts > b.pts) {
          return -1;
        }
        else if (a.pts < b.pts) {
          return 1;
        }
        else if (a.priority > b.priority) {
          return 1;
        }
        else {
          return -1;
        }
      });
    }
  });
