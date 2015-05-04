/*
 * grunt-transifex-keyvaluejson
 *
 *
 * Copyright (c) 2015 Maurice Williams
 * Licensed under the MIT license.
 */

'use strict';

var TrasifexResourceApi = require('../lib/transifex-api'),
    credentials         = require('../lib/credentials'),
    Promise             = require('bluebird'),
    path                = require('path'),
    fs                  = require('fs');

module.exports = function (grunt) {

    grunt.registerMultiTask('transifex_keyvaluejson', 'Grunt task that downloads string translations from Transifex in JSON format, maintaining original (nested) structure.', function () {

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
                project: '',
                resource: '',
                locales: '*',
                dest: './translations',
                credentials: '',
                mode: 'default'
            }),
            done = this.async(),
            resourceApi;

        //calculate absolute path to destination directory, using the project root dir as the base
        options.dest = path.join(process.cwd(), options.dest);

        //create destination directory
        grunt.file.mkdir(options.dest);

        //prompt for credentials
        var resolver = Promise.pending();

        //get credentials and set them
        credentials.read(function (error, creds) {
            options.credentials = creds;
            resolver.resolve(creds);
        });

        resolver.promise
            .then(function () {
                try {
                    resourceApi = new TrasifexResourceApi(options);
                    resourceApi.download()
                        .then(function (files) {

                            files.forEach(function (file) {
                                var stats = fs.statSync(file);
                                grunt.log.writeln('Crated file: ' + file + ' (' + stats['size'] + 'bytes)');
                            });

                            done();
                        })
                        .catch(function (error) {
                            grunt.fail.fatal(error);
                        });
                } catch(error) {
                    grunt.fail.fatal(error);
                }
            });
    });

};
