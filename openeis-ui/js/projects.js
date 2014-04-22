angular.module('openeis-ui.projects', [
    'openeis-ui.auth', 'openeis-ui.file',
    'ngResource', 'ngRoute', 'mm.foundation', 'angularFileUpload',
])
.config(function ($routeProvider) {
    $routeProvider
        .when('/projects', {
            controller: 'ProjectsCtrl',
            templateUrl: 'partials/projects.html',
            resolve: {
                projects: ['Projects', function(Projects) {
                    return Projects.query();
                }]
            },
        })
        .when('/projects/:projectId', {
            controller: 'ProjectCtrl',
            templateUrl: 'partials/project.html',
            resolve: {
                project: ['Projects', '$route', function(Projects, $route) {
                    return Projects.get($route.current.params.projectId);
                }],
                projectFiles: ['ProjectFiles', '$route', function(ProjectFiles, $route) {
                    return ProjectFiles.query($route.current.params.projectId);
                }],
            },
        });
})
.factory('Projects', function ($resource, API_URL) {
    var resource = $resource(API_URL + '/projects/:projectId', { projectId: '@id' }, {
        create: { method: 'POST' },
        save: { method: 'PUT' },
    });

    return {
        get: function (projectId) {
            return resource.get({ projectId: projectId}).$promise;
        },
        query: function () {
            return resource.query().$promise;
        },
        create: function (project) {
            return resource.create(project).$promise;
        },
        save: function (project) {
            return resource.save(project).$promise;
        },
        delete: function (projectId) {
            return resource.delete({ projectId: projectId }).$promise;
        },
    };
})
.factory('ProjectFiles', function ($resource, API_URL, $http) {
    var resource = $resource(API_URL + '/files/:fileId');

    return {
        query: function (projectId) {
            return resource.query({ project: projectId }).$promise;
        },
        delete: function (fileId) {
            return resource.delete({ fileId: fileId }).$promise;
        },
        head: function (fileId) {
            return $http({
                method: 'GET',
                url: API_URL + '/files/' + fileId + '/head',
                transformResponse: angular.fromJson,
            });
        },
        headCsv: function (fileId) {
            return $http({
                method: 'GET',
                url: API_URL + '/files/' + fileId + '/top',
                transformResponse: angular.fromJson,
            });
        },
    };
})
.controller('ProjectsCtrl', function ($scope, projects, Projects) {
    $scope.projects = projects;

    $scope.newProject = {
        name: '',
        create: function () {
            Projects.create({ name: $scope.newProject.name }).then(function (response) {
                $scope.newProject.name = '';
                $scope.projects.push(response);
            });
        },
    };

    $scope.renameProject = function ($index) {
        var newName = prompt("New project name:");

        if (!newName || !newName.length) {
            return;
        }

        $scope.projects[$index].name = newName;
        $scope.projects[$index].$save(function (response) {
            $scope.projects[$index] = response;
        });
    };

    $scope.deleteProject = function ($index) {
        $scope.projects[$index].$delete(function () {
            $scope.projects.splice($index, 1);
        });
    };
})
.controller('ProjectCtrl', function ($scope, project, projectFiles, $modal, $upload, API_URL, ProjectFiles) {
    $scope.project = project;
    $scope.projectFiles = projectFiles;

    $scope.upload = function (fileInput) {
        angular.forEach(fileInput[0].files, function(file) {
            $upload.upload({
                url: API_URL + '/projects/' + project.id + '/add_file',
                file: file,
            }).then(function (response) {
                ProjectFiles.headCsv(response.data.id).then(function (headResponse) {
                    if (headResponse.data.has_header) {
                        headResponse.data.header = headResponse.data.rows.shift();
                    }
                    response.data.head = headResponse.data;
                    $scope.openModal(response.data);
                });

                $scope.projectFiles.push(response.data);
                fileInput.val('').triggerHandler('change');
            });
        });
    };

    $scope.deleteFile = function ($index) {
        ProjectFiles.delete($scope.projectFiles[$index].id).then(function (response) {
            $scope.projectFiles.splice($index, 1);
        });
    };

    $scope.openModal = function (file) {
        var modalInstance = $modal.open({
            templateUrl: 'partials/addfile.html',
            controller: 'FileModalCtrl',
            resolve: {
                file: function () {
                    return file;
                },
            },
        });

        modalInstance.result.then(function (response) {
            console.log(response);
        }, function (rejection) {
            console.log(rejection);
        });
    };
})
.controller('FileModalCtrl', function ($scope, $modalInstance, file) {
    $scope.file = file;

    $scope.ok = function () {
        $modalInstance.close("Clicked OK.");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancelled.");
    };
});
