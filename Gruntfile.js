module.exports = function(grunt) {
  grunt.initConfig({
    
    jshint: ['Gruntfile.js'],  // Testing out on gruntfile.

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

    concat: {
      js: {
        files: {
          'build/js/bundle.js': 'js/**/*.js',
        }
      }
    },

    ngAnnotate: {
      js: {
        files:{
          'build/js/bundle.js': 'build/js/bundle.js',
        }
      },
    },

    uglify: {
      bundle: {
        files: {
          'build/js/bundle.min.js': 'build/js/bundle.js', 
        }
      }
    },

    clean: {
      build: 'build/',
      css: 'stylesheets/*.css*'  // Can remove once fully migrated over to build/ for deployment.
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('js-prod', ['concat', 'ngAnnotate', 'uglify']); 
  grunt.registerTask('css-prod', ['sass']); 
  grunt.registerTask('default', ['jshint', 'css-prod', 'js-prod']); // Runs upon 'grunt' with no args.
};
