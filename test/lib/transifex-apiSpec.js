var expect      = require('chai').expect,
    _           = require('lodash'),
    fs          = require('fs'),
    rmrf        = require('rimraf');
    nock        = require('nock'),
    path        = require('path'),

    ResourceApi = require('../../lib/transifex-api'),

    remoteUrl   = 'https://www.transifex.com/api/2',
    options     = {
                    project: 'fake-project',
                    resource: 'fake-resource',
                    dest: __dirname + '/../tmp',
                    mode: 'default',
                    credentials: {  user: 'fake-user',
                                    pass: 'fake-password'
                                }
                };


describe('Transifex Resource API', function () {

    it('Returns an instance if valid options are passed in', function () {
        try {
            var api = new ResourceApi(options);
            expect(api).to.be.ok;
        } catch (error) {
            expect(error).to.not.be.ok;
        }
    });

    describe('Its constructor will throw an exception if', function () {
        var tmpOptions;

        beforeEach(function () {
            tmpOptions = {
                project: 'fake-project',
                resource: 'fake-resource',
                dest: '../tmp',
                credentials: {  user: 'fake-user',
                    pass: 'fake-password'
                }
            };
        });

        it('no options are passed in', function () {
            try {
                var api = new ResourceApi();

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
            }
        });

        it('does not get a `project` attribute', function (done) {
            try {
                tmpOptions.project = '';
                var api = new ResourceApi(tmpOptions);

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
                expect(error).to.contain('project');
                done();
            }
        });

        it('does not get a `resource` attribute', function (done) {
            try {
                tmpOptions.resource = '';
                var api = new ResourceApi(tmpOptions);

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
                expect(error).to.contain('resource');
                done();
            }
        });

        it('does not get a `dest` attribute', function (done) {
            try {
                tmpOptions.dest = '';
                var api = new ResourceApi(tmpOptions);

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
                expect(error).to.contain('dest');
                done();
            }
        });

        it('does not get a `credentials` attribute', function (done) {
            try {
                tmpOptions.credentials = '';
                var api = new ResourceApi(tmpOptions);

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
                expect(error).to.contain('credentials');
                done();
            }
        });

        it('it gets an invalid `credentials` attribute', function (done) {
            try {
                tmpOptions.credentials = {wrong: 'attributes'};
                var api = new ResourceApi(tmpOptions);

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
                expect(error).to.contain('credentials');
                done();
            }
        });

        it('gets an invalid `mode` attribute', function (done) {
            try {
                tmpOptions.mode = 'fake-mode';
                var api = new ResourceApi(tmpOptions);

                done(Error('expected a thrown exception'));
            } catch (error) {
                expect(error).to.be.ok;
                expect(error).to.contain('mode');
                done();
            }
        });


    });

    describe('#avilableLocales', function () {
        var api;
        before(function () {
            api = new ResourceApi(options);
        });

        beforeEach(function () {
            nock(remoteUrl)
                .get('/project/' + options.project + '/resource/' + options.resource + '?details')
                .reply(200, {
                    'source_language_code': 'en',
                    'name': 'Fake Resource',
                    'created': '2015-04-30T14:06:24.771',
                    'wordcount': 63,
                    'i18n_type': 'KEYVALUEJSON',
                    'project_slug': 'fake-project',
                    'accept_translations': true,
                    'last_update': '2015-05-01T01:14:23.052',
                    'priority': '0',
                    'available_languages': [
                        {
                            'code_aliases': ' ',
                            'code': 'en',
                            'name': 'English'
                        },
                        {
                            'code_aliases': ' ',
                            'code': 'es',
                            'name': 'Spanish'
                        }
                    ],
                    'total_entities': 13,
                    'slug': 'fake-resource',
                    'categories': null
                });
        });

        it('returns an array of strings', function (done) {
            api.avilableLocales()
                .then(function (response) {
                    expect(response).to.be.instanceof(Array);
                    expect(response.length).to.be.greaterThan(0);
                    expect(response[0]).to.be.a('string');
                    done();
                })
                .catch(function (error) {
                    done(error);
                });
        });

        it('to have 2 locals', function (done) {
            api.avilableLocales()
                .then(function (response) {
                    expect(response.length).to.equal(2);
                    expect(response).to.contain('en');
                    expect(response).to.contain('es');
                    done();
                })
                .catch(function (error) {
                    done(error);
                });
        });
    });

    describe('#getLocale', function () {
        var api;
        before(function () {
            api = new ResourceApi(options);
        });

        beforeEach(function () {
            nock(remoteUrl)
                .get('/project/' + options.project + '/resource/' + options.resource + '/translation/' + 'en' + '?mode=' + options.mode)
                .reply(200, {
                    'content': '{\n\n"firstLevel": {\n\n\n"test2": "test2",\n\n\n"secondLevel": {\n\n\n\n"test3": "test3",\n\n\n\n"test4": "test4"\n\n\n},\n\n\n"test1": "test1"\n\n},\n\n"test0": "test"\n}',
                    'mimetype': 'application/json'
                });
        });

        it('returns a string that can be parsed into an object', function (done) {
            api.getLocale('en')
                .then(function (resopnse) {
                    expect(resopnse).to.be.an('string');
                    expect(JSON.parse(resopnse)).to.be.ok;
                    expect(JSON.parse(resopnse)).to.be.an('object');
                    done();
                })
                .catch(function (error) {
                    done(error);
                })
        });
    });

    describe('#download', function () {

        beforeEach(function () {
            nock(remoteUrl)
                .get('/project/' + options.project + '/resource/' + options.resource + '/translation/' + 'en' + '?mode=' + options.mode)
                .reply(200, {
                    'content': '{\n\n"firstLevel": {\n\n\n"test2": "test2",\n\n\n"secondLevel": {\n\n\n\n"test3": "test3",\n\n\n\n"test4": "test4"\n\n\n},\n\n\n"test1": "test1"\n\n},\n\n"test0": "test"\n}',
                    'mimetype': 'application/json'
                });

            nock(remoteUrl)
                .get('/project/' + options.project + '/resource/' + options.resource + '/translation/' + 'es' + '?mode=' + options.mode)
                .reply(200, {
                    'content': '{\n\n"firstLevel": {\n\n\n"test2": "test2",\n\n\n"secondLevel": {\n\n\n\n"test3": "test3",\n\n\n\n"test4": "test4"\n\n\n},\n\n\n"test1": "test1"\n\n},\n\n"test0": "test"\n}',
                    'mimetype': 'application/json'
                });

            nock(remoteUrl)
                .get('/project/' + options.project + '/resource/' + options.resource + '?details')
                .reply(200, {
                    'source_language_code': 'en',
                    'name': 'Fake Resource',
                    'created': '2015-04-30T14:06:24.771',
                    'wordcount': 63,
                    'i18n_type': 'KEYVALUEJSON',
                    'project_slug': 'fake-project',
                    'accept_translations': true,
                    'last_update': '2015-05-01T01:14:23.052',
                    'priority': '0',
                    'available_languages': [
                        {
                            'code_aliases': ' ',
                            'code': 'en',
                            'name': 'English'
                        },
                        {
                            'code_aliases': ' ',
                            'code': 'es',
                            'name': 'Spanish'
                        }
                    ],
                    'total_entities': 13,
                    'slug': 'fake-resource',
                    'categories': null
                });
        });

        afterEach(function (done) {
            rmrf(options.dest, function () {
                done()
            });
        });

        it('will change `options.locales` from `*` to an array', function (done) {
            var api = new ResourceApi(options);
            expect(api.options.locales).to.equal('*');
            api.download()
                .then(function () {
                    expect(api.options.locales).to.be.instanceof(Array);
                    expect(api.options.locales.length).to.equal(2);
                    done();
                })
                .catch(function (error) {
                    done(error);
                });
        });

        it('will not change `options.locales` if one is specified', function (done) {
            var newOptions = _.defaults({'locales': 'en'}, options);
            var api = new ResourceApi(newOptions);

            api.download()
                .then(function () {
                    expect(api.options.locales).to.be.instanceof(Array);
                    expect(api.options.locales.length).to.equal(1);
                    done();
                })
                .catch(function (error) {
                    done(error);
                });
        });

        it('will create a non-empty file for each locale in the `options.dist` location', function (done) {
            var newOptions = _.defaults({'locales': 'en'}, options);
            var api = new ResourceApi(newOptions);

            api.download()
                .then(function () {
                    expect(fs.existsSync(newOptions.dest)).to.be.true;
                    fs.readdir(newOptions.dest, function (error, files) {
                        expect(files.length).to.equal(newOptions.locales.length);

                        var fileStats = fs.statSync(path.join(newOptions.dest, files[0]));
                        expect(fileStats['size']).to.greaterThan(0);

                        done();
                    });
                })
                .catch(function (error) {
                    done(error);
                });
        });

        it ('will create files with JSON content', function (done) {
            var newOptions = _.defaults({'locales': 'en'}, options);
            var api = new ResourceApi(newOptions);

            api.download()
                .then(function () {
                    fs.readdir(newOptions.dest, function (error, files) {
                        var pathToFile = path.join(newOptions.dest, files[0]);
                        var fileStats = fs.statSync(pathToFile);
                        expect(fileStats['size']).to.not.equal(0);
                        var fileContent = fs.readFileSync(pathToFile, 'utf-8');
                        expect(JSON.parse(fileContent)).to.be.ok;
                        expect(JSON.parse(fileContent)).to.be.an('object');

                        done();
                    });
                })
                .catch(function (error) {
                    done(error);
                });
        });

    });


});
