module.exports = function (grunt) {

  grunt.initConfig({
     // ES6 to ES5
        babel: {
            options: {},
            dist: {
              files: {
                  'scripts/main-built.js': 'scripts/main.js'
              }
          }
        }
   });

  grunt.loadNpmTasks('grunt-babel');


  grunt.registerTask('default', ['babel']);
};