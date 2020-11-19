var gulp = require('gulp'),
  gutil = require('gulp-util'),
  path = require('path'),
  jshint = require('gulp-jshint'),
  nodemon = require('gulp-nodemon'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  pretty = require('pino').pretty;

var plugins = gulpLoadPlugins({});
var config = {
  js: ['src/**/*.js']
};

gulp.task('jshint', function() {
  return gulp.src(config.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', gulp.series(['jshint'], (done) => {
  nodemon({
      watch: 'src',
      script: 'src/server.js',
      env: {
        'NODE_ENV': 'development',
        'MONGODB_URI': 'mongodb://localhost/evotempus',
        'PORT': 3001,
        'LOG_LEVEL': 'debug'
      },
      ext: 'js',
      tasks: ['jshint'],
      done: done
    })
    .on('readable', function() { // the `readable` event indicates that data is ready to pick up
      this.stdout.pipe(pretty()).pipe(process.stdout);
			this.stderr.pipe(pretty()).pipe(process.stdout);
      this.stdout.pipe(pretty()).pipe(gulp.dest('server.log'));
      this.stderr.pipe(pretty()).pipe(gulp.dest('server.log'));
    })
    .on('restart', () => {
      console.log('Server refreshed');
    });
  })
);
