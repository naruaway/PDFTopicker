import gulp from 'gulp'
import browserify from 'browserify'
import babelify from 'babelify'
import babel from 'gulp-babel'
import source from 'vinyl-source-stream'

gulp.task('js', () => {
  return gulp.src('src/*.js')
    .pipe(babel({
      presets: ['es2015'],
    }))
    .pipe(gulp.dest('dist'));
})

gulp.task('uijs', () => {
  browserify('uisrc/main.js', { debug: true })
   .transform(babelify, {presets: ['es2015']})
   .bundle()
   .on("error", function (err) { console.log("Error : " + err.message); })
   .pipe(source('script.js'))
   .pipe(gulp.dest('ui'))
})

gulp.task('html', () => {
  gulp.src('uisrc/*.html')
    .pipe(gulp.dest('ui'))
})

gulp.task('css', () => {
  gulp.src('uisrc/*.css')
    .pipe(gulp.dest('ui'))
})

gulp.task('watch', () => {
  gulp.watch(['src/*', 'uisrc/*'], ['js', 'uijs', 'html', 'css'])
})

gulp.task('default', ['js', 'uijs', 'css', 'html', 'watch'])
