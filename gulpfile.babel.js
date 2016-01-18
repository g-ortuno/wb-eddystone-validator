import gulp from 'gulp';
import jshint from 'gulp-jshint';
import jscs from 'gulp-jscs';

gulp.task('test', [
  'test:jshint',
  'test:jscs'
]);

gulp.task('test:jshint', () => {
  return gulp.src(['gulpfile.babel.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('test:jscs', () => {
  return gulp.src(['gulpfile.babel.js'])
    .pipe(jscs())
    .pipe(jscs.reporter());
});
