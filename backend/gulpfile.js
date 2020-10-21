var gulp = require('gulp'),
  gutil = require('gulp-util'),
  path = require('path'),
  jshint = require('gulp-jshint'),
  nodemon = require('gulp-nodemon'),
  gulpLoadPlugins = require('gulp-load-plugins');

var plugins = gulpLoadPlugins({});
var config = {
  js: ['src/**/*.js']
};

gulp.task('jshint', function() {
  return gulp.src(config.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

// Will refresh data in the database
gulp.task('full-start', gulp.series(['jshint'], (done) => {
  nodemon({
      watch: 'src',
      script: 'src/server.js',
      ext: 'js',
      env: {
        'NODE_ENV': 'development',
        'IMPORT_DB': true
      },
      tasks: ['jshint'],
      done: done
    })
    .on('restart', () => {
      console.log('Server refreshed');
    })
}));

gulp.task('default', gulp.series(['jshint'], (done) => {
  nodemon({
      watch: 'src',
      script: 'src/server.js',
      ext: 'js',
      tasks: ['jshint'],
      done: done
    })
    .on('restart', () => {
      console.log('Server refreshed');
    })
}));
