[![Build Status](https://travis-ci.org/morficus/grunt-transifex-keyvaluejson.svg)](https://travis-ci.org/morficus/grunt-transifex-keyvaluejson)
# grunt-transifex-keyvaluejson

> Grunt task that downloads string translations from Transifex in JSON format, maintaining original (nested) structure using the Transifex [Translation](http://docs.transifex.com/developer/api/translations#uploading-and-downloading-translations) and [Resoureces](http://docs.transifex.com/developer/api/resources#uploading-and-downloading-resources) API  

Inspired by [grunt-transifex](https://github.com/erasys/grunt-transifex)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-transifex-keyvaluejson --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-transifex-keyvaluejson');
```

## The "transifex_keyvaluejson" task

### Overview
In your project's Gruntfile, add a section named `transifex_keyvaluejson` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  transifex_keyvaluejson: {
    options: {
      project: '',
      resource: '',
      locales: '*',
      dest: '/translations',
      mode: 'default',
      showStats: true
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.project
Type: `String`  
Mandatory: yes  
Default value: `''`

Project slug for the Transifex project you are interested in ([more info](http://docs.transifex.com/developer/introduction/#project))

#### options.resource  
Type: `String`  
  Mandatory: yes  
Default value: `''`

Resource slug for the resource under the Transifex project ([more info](http://docs.transifex.com/developer/introduction/#resource))

#### options.locales
Type: `Array` or `String`  
 Mandatory: no  
Default value: `'*'`

List of locales to download. i.e.: en, en_US, es_PA, de_DE, etc

#### options.dest  
Type: `String`  
Mandatory: no  
Default value: `'/translations'`

Output directory where the translated strings will be saved.  
The path will always be taken as relative to the projects root directory.

#### options.mode
Type: `String`  
Mandatory: no  
Default value: `'default'`


Directly related to the `mode` parameter in the Transifex API ([more info](http://docs.transifex.com/developer/api/translations#get))  
It's basically a filter to indicate what translated strings should be downloaded.  
Available options are:

* `default`: to include all translated strings in the response.  
* `reviewed`: to include only reviewed strings in the response  
* `translator`: to get a response suitable for offline translations.  
* `onlytranslated`: to get a response that will include the translated strings and the untranslated ones will be returned empty.  
* `onlyreviewed`: to get a response that will include the only the reviewed strings and the rest (translated or not) will be returned empty.  

## Transifex credentials
(the code for this has been leveraged from the [grunt-transifex](https://github.com/erasys/grunt-transifex) project)

When the plugin runs for the first time, it will prompt the user for a Transifex username and password.
It will store this information in a `.transifexrc` file created in the current directory. 

On subsequent executions, the user won't be prompted again. Transifex credentials will be read from `.transifexrc`
