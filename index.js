// Built on Rework. Can modify font names
// Author: Pavlo Vozniuk
//
// Options:
// 
// 		replace: Replaces old value by new one (can be a string, array or function)
// 		prepend: Prepends new font to font list (can be a string, array or function)
// 		append: Appends font to font list (can be a string, array or function)
//		ignore: If node has in font stack at least one font from ignore list, rules can't be applied to this node;
//				Can be a string, array or function
//				you can also add '!important' and 'inherit' as one of the values,
// 				so all fonts stacks with !important will be ignored
//				default value: ['inherit']
//		important: How to rework !important;  possible values:
//			'keep': default value, keeps !important where they are
//			'add': adds !important for all acceptable font stacks (i.e. all except ignored ones)
//			'remove': removes !important everywhere
//		log: if it is true, rework-font-names will log to console
//
//		functions for replace, prepend and apppend options have four params:
//		value: raw value of font-family or font property
// 		fonts: a normalized list of fonts
// 		important: true if font-stack has !important
//					false if font-stack doesn't have !important


var walk = require('rework-walk');

module.exports = function modify(options) {

	options = options || {}
	if(!options.ignore){
		options.ignore = ['inherit'];
	}


	return function modify(style) {

		function parseFont(font){
			var rx = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\"\sa-z]+?)\s*$/i;
			var parts = rx.exec( font );
			var fontParts = {};
			if( parts ){
				fontParts.fontStyle   = parts[1] || false; //'normal';
				fontParts.fontVariant = parts[2] || false; //'normal';
				fontParts.fontWeight  = parts[3] || false; //'normal';
				fontParts.fontSize    = parts[4] || false;
				fontParts.lineHeight  = parts[5] || false;
				fontParts.fontFamily  = parts[6] || false;
			}
			return fontParts;
		}

		function joinFont(parts){
			parts = parts || {};
			joinedFont = "";
			joinedFont += parts.fontStyle ? parts.fontStyle + " " : "";
			joinedFont += parts.fontVariant ? parts.fontVariant + " " : "";
			joinedFont += parts.fontWeight ? parts.fontWeight + " " : "";
			joinedFont += parts.fontSize ? parts.fontSize : "";
			joinedFont += parts.lineHeight ? "/"+parts.lineHeight : "";
			joinedFont += " ";
			joinedFont += parts.fontFamily ? parts.fontFamily : "";
			return joinedFont;
		}

		// format acceptable new font list
		function formatNewFontList(list, value, fonts, important){
			if( typeof list == "function") {
				return list(value, fonts, important);
			} else {
				return '"' + unquote(list).join('", "') + '"';
			}
		}

		// remove quotes & extra spaces
		function unquote(list){
			if ( typeof list != 'object' && typeof list != 'array' ){
				list = [list];
			}

			for(i in list){
				list[i] = list[i].replace(/['",]+/g, '').trim();
			}

			//if(options.log == true) { console.log("list > ", list); }
			return list;
		}

		// apply all rules for font stack
		function applyRules(value){
			var parts = value.split('!');
			var fonts = unquote(parts[0].split(','));
			var hasIgnore = parts[1] ? true : false;

			//----- check if we don't have ignored fonts inside current value
			if( options.ignore ){

				if( typeof options.ignore == "function" ){

					if( options.ignore(value, fonts, hasIgnore) == true ){
						if(options.log == true) { console.log("font stack '" + value + "' ignored because of function"); }
						return value;
					}

				} else {

					options.ignore = unquote(options.ignore);
					for( i in options.ignore){
						if(options.ignore[i].toLowerCase() == "!important" && parts[1] && parts[1].toLowerCase() == "important"){
							if(options.log == true) { console.log("font stack '" + value + "' ignored because of !important rule"); }
							return value;
						}

						for( f in fonts) {
							if( options.ignore[i].toLowerCase() == fonts[f].toLowerCase() ){
								if(options.log == true) { console.log("font stack '" + value + "' ignored because of '" + options.ignore[i] + "'"); }
								return value;
							}
						}
					}

				}
			}

			//----- replace
			if( options.replace ) {
				var replaceStr = formatNewFontList(options.replace, value, fonts, hasIgnore );
				value = replaceStr;
				parts = value.split('!');
				fonts = unquote(parts[0].split(','));
				hasIgnore = parts[1] ? true : false;
			}

			//----- prepend
			if( options.prepend ) {
				var prependStr = formatNewFontList(options.prepend, value, fonts, hasIgnore );
				parts[0] = prependStr + ", " + parts[0];
			}

			//----- append
			if( options.append ) {
				var appendStr = formatNewFontList(options.append, value, fonts, hasIgnore );
				parts[0] = parts[0] + ", " + appendStr;
			}

			//----- important
			if (options.important == 'add'){
				parts[1] = 'important';
			}

			if (options.important == 'remove' && parts[1]){
				parts.pop()
			}

			result = parts.join('!');
			if(options.log == true) { console.log("result > ", result); }
			return result;
		}

		// precess rule
		function process(declaration){
			if ( declaration.property && declaration.property.toLowerCase() == "font-family") {
				if(options.log == true) { console.log('font > ', declaration.value); }
				declaration.value = applyRules(declaration.value);
			} else if ( declaration.property && declaration.property.toLowerCase() == "font") {
				if(options.log == true) { console.log('font > ', declaration.value); }
				var fontParts = parseFont(declaration.value);
				if( fontParts && fontParts.fontFamily ){
					fontParts.fontFamily = applyRules(fontParts.fontFamily);
					declaration.value = joinFont(fontParts);
				}
			}
			return declaration;
		}

		// Walk all styles
		walk(style, function(rule, node) {

			// Don't touch keyframes or font-face
			if (!rule.selectors || rule.selectors.toString().indexOf('@') >= 0) 
				return rule;


			rule.declarations = rule.declarations.map(function(declaration) {
				return process(declaration);
			});

		});

	}

};