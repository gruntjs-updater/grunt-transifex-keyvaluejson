var Promise     = require('bluebird'),
    request     = require('request'),
    _           = require('lodash'),
    path        = require('path'),
    fs          = require('fs');

/**
 *
 * @type {Function}
 * @params options {Object}
 *      project {String} Transifex Project
 *      resource {String} Transifex resource
 *      locales {String or Array} Single or list of locales to save
 *      dest {String} Absolute path to output directory
 *      credentials {Object}  User login information in this format: `{user: "string", pass: "string"}`
 *      mode {String} Valid values: default, reviewed, translator, onlytranslated, onlyreviewed
 */
var API = module.exports = function (options) {

    options = options || {};

    this.baseUrl = 'https://www.transifex.com/api/2';

    var defaultOptions = {
            project: '',
            resource: '',
            locales: '*',
            dest: '',
            credentials: '',
            mode: 'default'
        },
        validModes = ['default', 'reviewed', 'translator', 'onlytranslated', 'onlyreviewed'];

    this.options = _.defaults(options, defaultOptions);

    //some basic setting validations
    if (validModes.indexOf(this.options.mode) === -1) {
        throw 'Invalid `mode`: ' + this.options.mode + ' is not a valid setting. Available modes are ' + validModes.join(', ');
    }

    if (_.isEmpty(this.options.project)) {
        throw 'Missing option `project`: you MUST specify a project.';
    }

    if (_.isEmpty(this.options.resource)) {
        throw 'Missing option `resource`: you MUST specify a resource.';
    }

    if (_.isEmpty(this.options.dest)) {
        throw 'Missing option `dest`: you MUST specify a value for `dest`.';
    }

    if (_.isEmpty(this.options.credentials)) {
        throw 'Missing option `credentials`: you MUST specify a value for `credentials`.'
    } else if (!this.options.credentials.hasOwnProperty('user') || !this.options.credentials.hasOwnProperty('pass')) {
        throw 'Invalid `credentials` options:  must be in format: `{user: "string", pass: "string"}`';
    }
};

/**
 * Get a list of all available locales from Trasifex for the previously set resource
 *
 * @return Promise<Array>
 */
API.prototype.avilableLocales = function () {
    var path = '/project/' + this.options.project + '/resource/' + this.options.resource + '?details';

    return this.makeRequest({path: path})
        .then(function (response) {
            return _.pluck(response['available_languages'], 'code');
        })
        .catch(function (error) {
            throw error;
        });
};

/**
 * Get a list of all available resource-slugs from Trasifex for the previously set project
 *
 * @return Promise<Array>
 */
API.prototype.avilableResourece = function () {
    var path = '/project/' + this.options.project + '/resources/';

    return this.makeRequest({path: path})
        .then(function (response) {
            return _.pluck(response, 'slug');
        })
        .catch(function (error) {
            throw error;
        });
};

/**
 * Returns the translated JSON string for the specified locale
 *
 * @param locale {String} locale to retrieve
 * @return Promise<String>
 */
API.prototype.getLocale = function (locale) {
    var path = '/project/' + this.options.project + '/resource/' + this.options.resource + '/translation/' + locale + '?mode=' + this.options.mode;

    return this.makeRequest({path: path})
        .then(function (response) {
            return response['content'];
        })
        .catch(function (error) {
            throw error;
        });
};


API.prototype.download = function () {
    var localeListRequest = true,
        that = this;

    // a locale of `*` means to get all of them
    if (this.options.locales === '*') {
        localeListRequest = this.avilableLocales()
            .then(function (locales) {
                that.options.locales = locales;
                return locales;
            });
    } else {
        localeListRequest = Promise.resolve(undefined)
    }

    //create the output directory, if it doesn't already exist
    if (!fs.existsSync(that.options.dest)) {
        fs.mkdirSync(that.options.dest);
    }

    return localeListRequest
        .then(function () {
            //this is a map of triggered HTTP requests
            //see the Bluebird documentation for details: https://github.com/petkaantonov/bluebird/blob/master/API.md#props---promise
            var requests = {};

            //in case only 1 locale was provided, cast it to an array
            that.options.locales = _.isArray(that.options.locales)? that.options.locales : [that.options.locales];

            that.options.locales.forEach(function (locale) {
                requests[locale] = that.getLocale(locale);
            });

            //wait for all the requests to complete then write them to a file.
            return Promise.props(requests)
                .then(function (response) {
                    //use the locale name (in this case, the keys in the map) as the file name
                    var locales = Object.keys(response),
                        filePaths = [];
                    locales.forEach(function (locale) {
                        var outfile = path.join(that.options.dest, locale + '.json');
                        fs.writeFileSync(outfile, response[locale]);

                        filePaths.push(outfile);
                    });

                    return filePaths;
                })
                .catch(function (error) {
                    throw error;
                });
        });
};

/**
 *  Convenience method for sending a request to the Transifex API
 *
 * @param settings
 *  path {String} path to append to base API URL (should include query params, if necesary)
 *  @return Promise
 */
API.prototype.makeRequest = function (settings) {

    var requestOptions,
        resolver = Promise.pending();

    requestOptions = {
        url: this.baseUrl + settings.path,
        method: 'GET',
        auth: {
            username: this.options.credentials.user,
            password: this.options.credentials.pass,
            sendImmediately: true
        },
        json: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        }
    };

    request(requestOptions, function (error, rawResponse, body) {
        if (error) {
            return resolver.reject(error);
        }

        if (rawResponse.statusCode === 404) {
            return resolver.reject('Path was not found. Verify your `project` and `resource` values are correct: ' + settings.path);
        }

        if (rawResponse.statusCode === 401) {
            return resolver.reject('Invalid Transifex credentials. Check your .transifexrc file or delete it.');
        }

        return resolver.resolve(body);
    });

    return resolver.promise;

};
