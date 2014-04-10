angular.module('openeis-ui', [
    'openeis-ui.factories', 'openeis-ui.controllers',
    'ngAnimate', 'ngCookies', 'ngRoute',
])
.constant('API_URL', '/api') // URL of OpenEIS API, without trailing slash
.config(function ($routeProvider, $locationProvider, $httpProvider) {
    // Add method for routes requiring authentication
    $routeProvider.whenAuthenticated = function(path, route) {
        route.resolve = route.resolve || {};

        angular.extend(route.resolve, {
            // Use array syntax until ngmin can do it for us
            authenticated: ['Auth', function (Auth) {
                return Auth.isAuthenticated();
            }]
        });

        return $routeProvider.when(path, route);
    };

    $routeProvider
        .when('/', {
            controller: 'LoginCtrl',
            templateUrl: '/partials/login.html',
        })
        .whenAuthenticated('/projects', {
            controller: 'ProjectsCtrl',
            templateUrl: '/partials/projects.html',
            resolve: {
                projects: ['Projects', function(Projects) {
                    return Projects.query();
                }]
            },
        })
        .whenAuthenticated('/projects/:projectId', {
            controller: 'ProjectCtrl',
            templateUrl: '/partials/project.html',
            resolve: {
                project: ['Projects', '$route', function(Projects, $route) {
                    return Projects.get($route.current.params.projectId);
                }]
            },
        })
        .otherwise({
            templateUrl: '/partials/404.html',
        });

    $locationProvider.html5Mode(true);

    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
})
.run(function ($rootScope, Auth, $location) {
    $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
        console.log(rejection);
        if (rejection.status === 401) {
            $location.url('/');
        }
    });
})
