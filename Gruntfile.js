fs = require('fs');
module.exports = function(grunt) {
  grunt.initConfig({

    jshint: ['Gruntfile.js'],  // Testing out on gruntfile. Replace w/ js folder

    sass: {
      dist: {
        files: {
          'build/css/popup.css': 'stylesheets/popup.scss',
          'build/css/style.css': 'stylesheets/style.scss',
          'stylesheets/popup.css': 'stylesheets/popup.scss', // Delete once fully migrated to build/css/ for deployment
          'stylesheets/style.css': 'stylesheets/style.scss', // Delete once fully migrated to build/css/ for deployment
        },
        options: {
	        cacheLocation: 'stylesheets/.sass-cache',
	      }
      }
    },

    ngAnnotate: {
      js: {
        files:{
          '.tmp/concat/js/app.min.js': '.tmp/concat/js/app.min.js',
          '.tmp/concat/js/options.min.js': '.tmp/concat/js/options.min.js',
        }
      },
    },

    uglify: {
      chrome: {
        files: {
          'build/js/background.min.js': 'js/background.js',
          'build/js/content_script.min.js': 'js/content_script.js',
        }
      }
    },

    clean: {
      build: 'build/',
      temp: 'temp/',
      css: 'stylesheets/*.css*'  // Can remove once fully migrated over to build/ for deployment.
    },

    copy: {
      popup: {
        src: 'popup.html',
        dest: 'build/',
      },
      optionsPage: {
        src: 'components/options/interests.html',
        dest: 'build/',
      },
      manifest: {
        src: 'manifest.json',
        dest: 'build/',
      },
      contentscripts: {
        cwd: 'bower_components/jquery/dist/',
        expand: true,
        src: 'jquery.min.js', // for content script injection.
        dest: 'build/js'
      }
    },

    watch: {
      js: {
        tasks: ['js-debug'],
        files: ['js/**/*.js']
      },

      sass: {
        tasks: ['css-debug'],
        files: ['stylesheets/*.scss']
      },

      // extension: {
      //   tasks: ['copy'],
      //   files: ['**/*.{html,json}', '!build/*']
      // },


    },

    // Sets up its own concat and uglify tasks.
    useminPrepare: {
      popup: {
        files: {src: ['popup.html']},
        options: {
          dest: 'build',
          type: 'html'
        }
      },
      optionsPage: {
        files: {src: ['components/options/interests.html']},
        options: {
          dest: 'build/components/options',
          type: 'html'
        }
      }
    },    

    usemin: {
      popup: {
        files: {src: ['build/popup.html',
                      'build/components/options/interests.html']},
        options: {
          type: 'html'
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-usemin');

  // Custom tasks.
  grunt.registerTask('update-manifest', function (key, value) {
      var projectFile = "./build/manifest.json",
          tempManifestObj,
          contentScripts,
          backgroundScripts;

      if (!grunt.file.exists(projectFile)) {
          grunt.log.error("file " + projectFile + " not found");
          return false;  // Abort.
      }

      // Grab file references
      tempManifestObj = require('./build/manifest.json');
      contentScripts = tempManifestObj.content_scripts[0];
      backgroundScripts = tempManifestObj.background.scripts;

      // Update file references
      contentScripts.js = ['js/jquery.min.js', 'js/content_script.min.js'];
      backgroundScripts = ['js/background.min.js'];

      // Write file
      fs.writeFileSync(projectFile, JSON.stringify(tempManifestObj,null,2));
  });

  // Task workflows.
  grunt.registerTask('js-debug', ['jshint']);
  grunt.registerTask('js-release', ['js-debug', 'concat', 'ngAnnotate', 'uglify']);

  grunt.registerTask('css-debug', ['sass']);

  grunt.registerTask('build', [ 'clean',
                                'useminPrepare',
                                'js-release',
                                'copy',
                                'usemin',
                                'update-manifest'
                              ]);
  grunt.registerTask('default', ['build']);
};
