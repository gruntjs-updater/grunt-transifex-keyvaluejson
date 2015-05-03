/*
 * grunt-transifex-keyvaluejson
 *
 *
 * Copyright (c) 2015 Maurice Williams
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
    // load all npm grunt tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                'libs/*.js'
            ],
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp', 'translations', '.transifexrc']
        },

        // Configuration to be run (and then tested).
        transifex_keyvaluejson: {
            default_options: {
                options: {
                    project: 'ghost-test-project',
                    resource: 'ghost-poc'
                }
            }
        },

        // Unit tests.
        mochacli: {
            options: {
                //all options specified in `test/mocha.opts`
            },
            all: ['test/*.js']
        },

        mocha_istanbul: {
            coverage: {
                src: 'test'
            }
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['mocha_istanbul']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test', 'clean']);

};
