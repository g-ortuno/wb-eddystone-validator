import gulp from 'gulp';
import jshint from 'gulp-jshint';

gulp.task('test', [
  'test:jshint'
]);

gulp.task('test:jshint', () => {
  return gulp.src(['gulpfile.babel.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});
