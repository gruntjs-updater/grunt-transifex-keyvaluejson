var Promise     = require('bluebird'),
    request     = require('request'),
    grunt       = require('grunt'),
    credentials = require('./credentials'),
    _           = require('lodash'),
    url = require('url'),
    path        = require('path');

/*
Transifex end-points I care about:
 http://docs.transifex.com/developer/api/resources
    Get available resources:
        https://www.transifex.com/api/2/project/ghost-test-project/resources

    Get list of available languages for resource:
        https://www.transifex.com/api/2/project/ghost-test-project/resource/ghost-poc/?details

    Get the JSON strings, translated (need to parse the `content` attribute)
        https://www.transifex.com/api/2/project/ghost-test-project/resource/ghost-poc/translation/es
        en, es, en_US, hu_HU
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
        throw 'Missing option `project`: you MUST specify a project.'
    }

    if (_.isEmpty(this.options.resource)) {
        throw 'Missing option `resource`: you MUST specify a resource.'
    }

    if (_.isEmpty(this.options.dest)) {
        throw 'Missing option `dest`: you MUST specify a value for `dest`.'
    }

    /*
    if (_.isEmpty(this.options.credentials)) {
        throw 'There are no credentials inside the .transifexrc file.'
    }*/
    var that = this;
    credentials.read(function (error, creds) {
        that.options.credentials = creds;
    });
};

API.prototype.avilableLocales = function () {
    var url = '/project/' + this.options.project + '/resource/' + this.options.resource + '?details';

    return this.makeRequest({url: url})
        .then(function (response) {
            return _.pluck(response.available_languages, 'code');
        })
        .catch(function (error) {
            throw error;
        });
};

API.prototype.getLocale = function (locale) {
    var url = '/project/' + this.options.project + '/resource/' + this.options.resource + '/translation/' + locale + '?mode=' + this.options.mode;

    return this.makeRequest({url: url})
        .then(function (response) {
            return response.content;
        });
};


API.prototype.download = function () {
    var localeListRequest = true,
        that = this;

    if (this.options.locales === '*') {
        localeListRequest = this.avilableLocales()
            .then(function (locales) {
                that.options.locales = locales;
                return locales;
            });
    } else {
        localeListRequest = Promise.resolve(undefined)
    }

    return localeListRequest
        .then(function () {
            var requests = {};
            //in case only 1 locale was provided, cast it to an array
            that.options.locales = _.isArray(that.options.locales)? that.options.locales : [that.options.locales];

            that.options.locales.forEach(function (locale) {

                requests[locale] = that.getLocale(locale)
            });

            Promise.props(requests)
                .then(function (response) {
                    //write each response to a file
                    Object.keys(response).forEach(function (locale) {
                        //TODO: use `path.resolve` in place of string concatination
                        fs.writeFile(that.options.dest + '/' + locale + '.json', response[locale]);
                    });
                });
        });
};

/**
 *
 * @param settings
 *  url:
 *  method:
 */
API.prototype.makeRequest = function (settings) {

    var requestOptions,
        resolver = Promise.pending();

    requestOptions = {
        url: this.baseUrl + settings.url,
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

    //TODO: need a way to handle 404's and 401's
    request(requestOptions, function (error, rawResponse, body) {
        if (error) {
            return resolver.reject(error);
        }

        return resolver.resolve(body);
    });

    return resolver.promise;

};