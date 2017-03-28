Rework Font Names in CSS
======

Font names plugin for Rework

Allows for CSS to modify font-names in 'font' and 'font-family' rules

## Options

Pass in an options object to configure the plugin. Possible options:

* `replace`: replaces old value by new one (can be a string, array or function)
* `prepend`: prepends new font(s) to font list (can be a string, array or function)
* `append`: appends font(s) to font list (can be a string, array or function)
* `ignore`: if rule has in font stack at least one font from ignore list, replace/prepend/append options can't be applied to this rule. Can be a string, array or function. You can also add '!important' and 'inherit' as option values, and all fonts stacks with '!important' or 'inherit' will be ignored. Default value forn `ignore` option is ['inherit'] 
* `important`: how to rework !important;  possible values:
  * `keep`: default value, keeps !important where they are
  * `add`: adds !important for all acceptable font stacks (i.e. all ones except ignored ones)
  * `remove`: removes !important from all acceptable font stacks (i.e. all ones except ignored ones)

Functions for replace, prepend and apppend options can have four params:
* `value`: raw value of font-family or font property
* `fonts`: a normalized list of fonts
* `important`: true if font-stack has !important; false if font-stack doesn't have !important

## Example 

The following gulp snippet

```javascript
var rework = require('gulp-rework');
rework.fontNames = require('rework-font-names');

return gulp.src('app/styles/main.css')
    .pipe(rework(rework.fontNames({
        replace: function(v,f,i){ return v.replace(/Ariel/gi, 'Arial');  },
        prepend: ["PT Sans", 'Helvetica Neue'],
        append: 'sans-serif',
        ignore: ['Courier New', '!important', 'inherit'],
    })))
    .pipe(gulp.dest('dist/css'))
```

Will turn

```css
html {
  font: bold 16px/1.4em Ariel, "Helvetica";
}

body {
  font-family: Ariel; 
}

#wrapper {
  font: 'courier new';
}

.button {
  font-family: Tahoma !important;
}
```
    
Into 

```css
html {
  font: bold 16px/1.4em "PT Sans", "Helvetica Neue", Arial, "Helvetica", sans-serif;
}

body {
  font-family: "PT Sans", "Helvetica Neue", Arial, sans-serif; 
}

#wrapper {
  font: 'courier new';
}

.button {
  font-family: Tahoma !important
}
```
