/*!
 * Implements a Handlebars layer for FlowBoard.TemplateEngine
 */

( function ( $, undefined ) {
	window.mw = window.mw || {}; // mw-less testing
	mw.flow = mw.flow || {}; // create mw.flow globally

	var _tplcache = {},
		_timestamp = {
		list: [],
		currentIndex: 0
	};


	/**
	 * Instantiates a FlowHandlebars instance for TemplateEngine.
	 * @param {Object} FlowStorageEngine
	 * @returns {FlowHandlebars}
	 * @constructor
	 */
	function FlowHandlebars( FlowStorageEngine ) {
		return this;
	}

	mw.flow.FlowHandlebars = FlowHandlebars;

	/**
	 * Returns a given template function. If template is missing, the template function is noop with mw.flow.debug.
	 * @param {String|Function} templateName
	 * @returns {Function}
	 */
	FlowHandlebars.prototype.getTemplate = function ( templateName ) {
		// If a template is already being passed, use it
		if ( typeof templateName === 'function' ) {
			return templateName;
		}

		if ( _tplcache[ templateName ] ) {
			// Return cached compiled template
			return _tplcache[ templateName ];
		}

		_tplcache[ templateName ] = mw.mantle.template.get( templateName + '.handlebars' );
		if ( _tplcache[ templateName ] ) {
			// Try to get this template via Mantle
			_tplcache[ templateName ] = _tplcache[ templateName ].render;
		}

		return _tplcache[ templateName ] || function () { mw.flow.debug( '[Handlebars] Missing template', arguments ); };
	};

	/**
	 * Processes a given template and returns the HTML generated by it.
	 * @param {String} templateName
	 * @param {*} [args]
	 * @returns {String}
	 */
	FlowHandlebars.prototype.processTemplate = function ( templateName, args ) {
		return FlowHandlebars.prototype.getTemplate( templateName )( args );
	};

	/**
	 * Runs processTemplate inside, but returns a DocumentFragment instead of an HTML string.
	 * This should be used for runtime parsing of a template, as it triggers processProgressiveEnhancement on the
	 * fragment, which allows progressiveEnhancement blocks to be instantiated.
	 * @param {String} templateName
	 * @param {*} [args]
	 * @returns {DocumentFragment}
	 */
	FlowHandlebars.prototype.processTemplateGetFragment = function ( templateName, args ) {
		var $fragment = $( document.createDocumentFragment() ),
			div = document.createElement( 'div' );

		div.innerHTML = FlowHandlebars.prototype.processTemplate( templateName, args );

		FlowHandlebars.prototype.processProgressiveEnhancement( div );

		while ( div.childNodes.length ) {
			$fragment[0].appendChild( div.childNodes[0] );
		}

		div = null;

		return $fragment[0];
	};

	/**
	 * A method to call helper functions from outside templates. This removes Handlebars.SafeString wrappers.
	 * @param {String} helperName
	 * @param {...*} [args]
	 * @return mixed
	 */
	FlowHandlebars.prototype.callHelper = function ( helperName, args ) {
		var result = this[ helperName ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		if ( result && result.string ) {
			return result.string;
		}
		return result;
	};

	/**
	 * Finds scripts of x-handlebars-template-progressive-enhancement type, compiles its innerHTML as a Handlebars
	 * template, and then replaces the whole script tag with it. This is used to "progressively enhance" a page with
	 * elements that are only necessary with JavaScript. On a non-JS page, these elements are never rendered at all.
	 * @param {Element|jQuery} target
	 * @todo Lacks args, lacks functionality, full support. (see also FlowHandlebars.prototype.progressiveEnhancement)
	 */
	FlowHandlebars.prototype.processProgressiveEnhancement = function ( target ) {
		$( target ).find( 'script' ).addBack( 'script' ).filter( '[type="text/x-handlebars-template-progressive-enhancement"]' ).each( function () {
			var $this = $( this ),
				data = $this.data(),
				target = $.trim( data.target ),
				$target = $this,
				content, $prevTarg, $nextTarg;

			// Find new target, if not the script tag itself
			if ( target ) {
				$target = $this.findWithParent( target );

				if ( !$target.length ) {
					mw.flow.debug( "[processProgressiveEnhancement] Failed to find target", target, arguments );
					return;
				}
			}

			// Replace the nested flowprogressivescript tag with a real script tag for recursive progressiveEnhancement
			content = this.innerHTML.replace( /<\/flowprogressivescript>/g, '</script>' );

			// Inject the content
			switch ( data.type ) {
				case 'content':
					// Insert
					$target.empty().append( content );
					// Get all new nodes
					$target = $target.children();
					break;

				case 'insert':
					// Store sibling before adding new content
					$prevTarg = $target.prev();
					// Insert
					$target.before( content );
					// Get all new nodes
					$target = $target.prevUntil( $prevTarg );
					break;

				case 'replace':
					/* falls through */
				default:
					// Store siblings before adding new content
					$prevTarg = $target.prev();
					$nextTarg = $target.next();
					// Insert
					$target.replaceWith( content );
					// Get all new nodes
					$target = $prevTarg.nextUntil( $nextTarg );
			}

			// $target now contains all the new elements inserted; let's recursively do progressiveEnhancement if needed
			FlowHandlebars.prototype.processProgressiveEnhancement( $target );

			// Remove script tag
			$this.remove();
		} );
	};

	/**
	 * Parameters could be Message::rawParam (in PHP) object, which will
	 * translate into a { raw: "string" } object in JS.
	 * @todo: this does not exactly match the behavior in PHP yet (no parse,
	 * no escape), but at least it won't print an [Object object] param.
	 *
	 * @param {Array} parameters
	 * @return {Array}
	 */
	function flowNormalizeL10nParameters( parameters ) {
		return $.map( parameters, function ( arg ) {
			return arg ? ( arg.raw || arg.plaintext || arg ) : '';
		} );
	}

	// @todo remove and replace with mw.message || $.noop
	/**
	 * Checks for a helper function based on a key.
	 *
	 * If not found, uses the mw.message API.
	 *
	 * In either case, optional variable arguments are passed (either as Message parameters or to
	 * the custom function)
	 *
	 * @param {string} str Key for message
	 * @param Object... [parameters] Parameters to pass as Message parameters or custom function
	 *   parameters
	 */
	function flowMessages( str ) {
		var parameters = flowNormalizeL10nParameters( Array.prototype.slice.call( arguments, 1 ) ),
			strings = ( {
				"post_moderation_state": function( type, replyToId, name ) {
					var str;
					if ( !replyToId ) {
						str = 'flow-' + type + '-title-content';
					} else {
						str = 'flow-' + type + '-post-content';
					}
					return mw.message( str ).params( [ name ] );
				},

				"time": function ( msgKeyPrefix, secondsAgo ) {
					var suffix = '-second',
						new_time = secondsAgo;

					if ( secondsAgo >= 604800 ) {
						new_time = secondsAgo / 604800;
						suffix = '-week';
					} else if ( secondsAgo >= 86400 ) {
						new_time = secondsAgo / 86400;
						suffix = '-day';
					} else if ( secondsAgo >= 3600 ) {
						new_time = secondsAgo / 3600;
						suffix = '-hour';
					} else if ( secondsAgo >= 60 ) {
						new_time = secondsAgo / 60;
						suffix = '-minute';
					}

					return mw.msg.call( this, msgKeyPrefix + suffix, Math.floor( new_time ) );
				},

				"datetime": function ( timestamp ) {
					return ( new Date( timestamp ) ).toLocaleString();
				}
			} ),
			result = strings[ str ];

		if ( !result ) {
			return mw.message( str ).params( parameters );
		}

		if ( $.isFunction( result ) ) {
			// Callable; return the result of callback(arguments)
			result = result.apply( strings, parameters );
		}

		// Return the result string
		return { text: function () { return result; } };
	}

	/**
	 * Calls flowMessages to get localized message strings.
	 * @todo use mw.message
	 * @example {{l10n "reply_count" 12}}
	 * @param {String} str
	 * @param {...*} [args]
	 * @param {Object} [options]
	 * @returns {String}
	 */
	FlowHandlebars.prototype.l10n = function ( str /*, args..., options */ ) {
		// chop off str and options leaving just args
		var args = flowNormalizeL10nParameters( Array.prototype.slice.call( arguments, 1, -1 ) ),
			res = flowMessages.call( mw, str, args ).text();

		if ( !res ) {
			mw.flow.debug( "[l10n] Empty String", args );
			return "(l10n:" + str + ")";
		}

		return res;
	};

	/**
	 * HTML-safe version of l10n.
	 * @returns {String|Handlebars.SafeString}
	 */
	FlowHandlebars.prototype.l10nParse = function ( str /*, args..., options */ ) {
		var args = flowNormalizeL10nParameters( Array.prototype.slice.call( arguments, 1, -1 ) );

		return FlowHandlebars.prototype.html(
			mw.message( str ).params( args ).parse()
		);
	};

	/**
	 * Parses the timestamp out of a base-36 UUID, and calls timestamp with it.
	 * @example {{uuidTimestamp id "flow-message-x-"}}
	 * @param {String} uuid id
	 * @param {String} str a message key prefix  which when combined with 'second', 'minute', 'hour',
	 *                 'week' matches an i18n message
	 * @param {bool} [timeAgoOnly]
	 * @param {String} [fallback] fallback string displayed when timestamp hovered over
	 * @returns {String}
	 */
	FlowHandlebars.prototype.uuidTimestamp = function ( uuid, str, timeAgoOnly, fallback ) {
		var timestamp = parseInt( uuid, 36 ).toString( 2 ); // base-36 to base-10 to base-2
		timestamp = Array( 88 + 1 - timestamp.length ).join( '0' ) + timestamp; // left pad 0 to 88 chars
		timestamp = parseInt( timestamp.substr( 0, 46 ), 2 ); // first 46 chars base-2 to base-10

		return FlowHandlebars.prototype.timestamp( timestamp, str, timeAgoOnly, fallback );
	};

	/**
	 * Generates markup for an "nnn sssss ago" and date/time string.
	 * @example {{timestamp start_time "flow-message-x-"}}
	 * @param {int} timestamp milliseconds
	 * @param {String} str a message key prefix which when combined with 'second', 'minute', 'hour',
	 *                 'week' matches an i18n message
	 * @param {bool} [timeAgoOnly]
	 * @param {str} fallback string displayed when timestamp hovered over and for posts older than a month
	 * @returns {String|undefined}
	 */
	FlowHandlebars.prototype.timestamp = function ( timestamp, str, timeAgoOnly, fallback ) {
		if ( isNaN( timestamp ) || !str ) {
			mw.flow.debug( '[timestamp] Invalid arguments', arguments);
			return;
		}

		var time_ago, guid,
			seconds_ago = ( +new Date() - timestamp ) / 1000;

		if ( seconds_ago < 2419200 ) {
			// Return "n ago" for only dates less than 4 weeks ago
			time_ago = FlowHandlebars.prototype.l10n( 'time', str, seconds_ago, {} );

			if ( timeAgoOnly === true ) {
				// timeAgoOnly: return only this text
				return time_ago;
			}
		} else if ( timeAgoOnly === true ) {
			// timeAgoOnly: return nothing
			return fallback;
		}

		// Generate a GUID for this element to find it later
		guid = (Math.random() + 1 ).toString( 36 ).substring( 2 );

		// Store this in the timestamps auto-updater array
		_timestamp.list.push( { guid: guid, timestamp: timestamp, str: str, failcount: 0 } );

		// Render the timestamp template
		return FlowHandlebars.prototype.html(
			FlowHandlebars.prototype.processTemplate(
				'timestamp',
				{
					time_iso: timestamp,
					time_readable: fallback || FlowHandlebars.prototype.l10n( 'datetime', timestamp, {} ),
					time_ago: time_ago,
					guid: guid
				}
			)
		);
	};

	/**
	 * Updates one <time> node at a time every 100ms, until finishing, and then sleeps 5s.
	 * Nodes do not get updated again until they have changed.
	 * @todo Perhaps only update elements within the viewport?
	 * @todo Maybe updating elements every few seconds is distracting? Think about this.
	 */
	function timestampAutoUpdate() {
		var arrayItem, $ago, failed, secondsAgo, text,
			currentTime = +new Date() / 1000;

		// Only update elements that need updating (eg. only update minutes every 60s)
		do {
			arrayItem = _timestamp.list[ _timestamp.list._currentIndex ];

			if ( !arrayItem || !arrayItem.nextUpdate || currentTime >= arrayItem.nextUpdate ) {
				break;
			}

			// Find the next array item
			_timestamp.list._currentIndex++;
		} while ( arrayItem );

		if ( !arrayItem ) {
			// Finished array; reset loop
			_timestamp.list._currentIndex = 0;

			// Run again in 5s
			setTimeout( timestampAutoUpdate, 5000 );
			return;
		}

		$ago = $( '#' + arrayItem.guid );
		failed = true;
		secondsAgo = currentTime - ( arrayItem.timestamp / 1000 );

		if ( $ago && $ago.length ) {
			text = FlowHandlebars.prototype.timestamp( arrayItem.timestamp, arrayItem.str, true );

			// Returned a valid "n ago" string?
			if ( text ) {
				// Reset the failcount
				failed = arrayItem.failcount = 0;

				// Set the next update time
				arrayItem.nextUpdate = currentTime + ( secondsAgo > 604800 ? 604800 - currentTime % 604800 : ( secondsAgo > 86400 ? 86400 - currentTime % 86400 : ( secondsAgo > 3600 ? 3600 - currentTime % 3600 : ( secondsAgo > 60 ? 60 - currentTime % 60 : 1 ) ) ) );

				// Only touch the DOM if the text has actually changed
				if ( $ago.text() !== text ) {
					$ago.text( text );
				}
			}
		}

		if ( failed && ++arrayItem.failcount > 9 ) {
			// Remove this array item if we failed this 10 times in a row
			_timestamp.list.splice( _timestamp.list._currentIndex, 1 );
		} else {
			// Go to next item
			_timestamp.list._currentIndex++;
		}

		// Run every 100ms until we update all nodes
		setTimeout( timestampAutoUpdate, 100 );
	}

	$( document ).ready( timestampAutoUpdate );

	/**
	 * Do not escape HTML string. Used as a Handlebars helper.
	 * @example {{html "<div/>"}}
	 * @param {String} string
	 * @returns {String|Handlebars.SafeString}
	 */
	FlowHandlebars.prototype.html = function ( string ) {
		return new Handlebars.SafeString( string );
	};

	/**
	 *
	 * @example {{block this}}
	 * @param {Object} context
	 * @param {Object} options
	 * @returns {String}
	 */
	FlowHandlebars.prototype.workflowBlock = function ( context, options ) {
		return FlowHandlebars.prototype.html( FlowHandlebars.prototype.processTemplate(
			"flow_block_" + context.type + ( context['block-action-template'] || '' ),
			context
		) );
	};

	/**
	 * @example {{post ../../../../rootBlock this}}
	 * @param {Object} context
	 * @param {Object} revision
	 * @param {Object} options
	 * @returns {String}
	 */
	FlowHandlebars.prototype.postBlock = function ( context, revision, options ) {
		return FlowHandlebars.prototype.html( FlowHandlebars.prototype.processTemplate(
			"flow_post",
			{
				revision: revision,
				rootBlock: context
			}
		) );
	};

	/**
	 * @example {{#each topics}}{{#eachPost this}}{{content}}{{/eachPost}}{{/each}}
	 * @param {String} context
	 * @param {String} postId
	 * @param {Object} options
	 * @returns {String}
	 * @todo support multiple postIds in an array
	 */
	FlowHandlebars.prototype.eachPost = function ( context, postId, options ) {
		var revId = ( context.posts && context.posts[postId] && context.posts[postId][0] ),
			revision = ( context.revisions && context.revisions[revId] ) || { content: null };

		if ( revision.content === null ) {
			mw.flow.debug( '[eachPost] Failed to find revision object', arguments );
		}

		return options.fn ? options.fn( revision ) : revision;
	};

	/**
	 * Simple math.
	 * @example {{math @index "+" 1}}
	 * @param {Number} lvalue
	 * @param {String} operator
	 * @param {Number} rvalue
	 * @param {Object} options
	 * @return {Number}
	 */
	FlowHandlebars.prototype.math = function ( lvalue, operator, rvalue, options ) {
		lvalue = parseFloat(lvalue);
		rvalue = parseFloat(rvalue);

		return {
			"+": lvalue + rvalue,
			"-": lvalue - rvalue,
			"*": lvalue * rvalue,
			"/": lvalue / rvalue,
			"%": lvalue % rvalue
		}[operator];
	};

	/**
	 * The progressiveEnhancement helper essentially does one of replace things:
	 * 1. type="replace": (target="selector") Replaces target entirely with rendered template.
	 * 2. type="content": (target="selector") Replaces target's content with rendered template.
	 * 3. type="insert": Inserts rendered template at the helper's location.
	 *
	 * This template is used to simplify server-side and client-side rendering. Client-side renders a
	 * progressiveEnhancement helper instantly, in the post-process stage. The server-side renders only a script tag
	 * with a template inside. This script tag is found ondomready, and then the post-processing occurs at that time.
	 *
	 * Option keys:
	 * * type=String (replace, content, insert)
	 * * target=String (jQuery selector; needed for replace and content -- defaults to self)
	 * * id=String
	 * @example {{#progressiveEnhancement type="content"}}{{> ok}}{{/progressiveEnhancement}}
	 * @param {Object} options
	 * @return {String}
	 * @todo Implement support for full functionality, perhaps revisit the implementation.
	 */
	FlowHandlebars.prototype.progressiveEnhancement = function ( options ) {
		var hash = options.hash,
			// Replace nested script tag with placeholder tag for
			// recursive progresiveEnhancement
			inner = options.fn( this ).replace( /<\/script>/g, '</flowprogressivescript>' );

		if ( !hash.type ) {
			hash.type = 'insert';
		}

		return FlowHandlebars.prototype.html(
			'<scr' + 'ipt' +
				' type="text/x-handlebars-template-progressive-enhancement"' +
				' data-type="' + hash.type + '"' +
				( hash.target ? ' data-target="' + hash.target +'"' : '' ) +
				( hash.id ? ' id="' + hash.id + '"' : '' ) +
			'>' +
				inner +
			'</scr' + 'ipt>'
		);
	};

	/**
	 * Runs a callback when user is anonymous
	 * @param array $options which must contain fn and inverse key mapping to functions.
	 *
	 * @return mixed result of callback
	 */
	FlowHandlebars.prototype.ifAnonymous = function( options ) {
		if ( mw.user.isAnon() ) {
			return options.fn( this );
		} else {
			return options.inverse( this );
		}
	};

	/**
	 * Adds returnto parameter pointing to given Title to an existing URL
	 * @param string $title
	 *
	 * @return string modified url
	 */
	FlowHandlebars.prototype.linkWithReturnTo = function( title ) {
		return mw.util.getUrl( title, {
			returntoquery: encodeURIComponent( window.location.search ),
			returnto: mw.config.get( 'wgPageName' )
		} );
	};

	/**
	 * Accepts the contentType and content properties returned from the api
	 * for individual revisions and ensures that content is included in the
	 * final html page in an XSS safe maner.
	 *
	 * It is expected that all content with contentType of html has been
	 * processed by parsoid and is safe for direct output into the document.
	 *
	 * Usage:
	 *   {{escapeContent revision.contentType revision.content}}
	 *
	 * @param {string} contentType
	 * @param {string} content
	 * @return {string}
	 */
	FlowHandlebars.prototype.escapeContent = function ( contentType, content ) {
		if ( contentType === 'html' ) {
			return FlowHandlebars.prototype.html( content );
		} else {
			return content;
		}
	};

	/**
	 * Renders a tooltip node.
	 * @example {{#tooltip positionClass="up" contextClass="progressive" extraClass="flow-my-tooltip"}}what{{/tooltip}}
	 * @param {Object} options
	 * @returns {String}
	 */
	FlowHandlebars.prototype.tooltip = function ( options ) {
		var params = options.hash;

		return FlowHandlebars.prototype.html( FlowHandlebars.prototype.processTemplate(
			"flow_tooltip",
			{
				positionClass: params.positionClass ? 'flow-ui-tooltip-' + params.positionClass : null,
				contextClass: params.contextClass ? 'mw-ui-' + params.contextClass : null,
				extraClass: params.extraClass,
				blockClass: params.isBlock ? 'flow-ui-tooltip-block' : null,
				content: options.fn( this )
			}
		) );
	};

	/**
	 * Return url for putting post into the specified moderation state.  If the user
	 * cannot put the post into the specified state a blank string is returned.
	 *
	 * @param {Object}
	 * @param {string}
	 * @return {string}
	 */
	FlowHandlebars.prototype.moderationAction = function ( actions, moderationState ) {
		return actions[moderationState] ? actions[moderationState].url : '';
	};

	/**
	 * Concatenate all unnamed handlebars arguments
	 *
	 * @return {string}
	 */
	FlowHandlebars.prototype.concat = function () {
		// handlebars puts an options argument at the end of
		// user supplied parameters, pop that off
		return Array.prototype.slice.call( arguments, 0, -1 ).join( '' );
	};

	/**
	 * Renders block if condition is true
	 *
	 * @param {string} value
	 * @param {string} operator supported values: 'or'
	 * @param {string} value
	 */
	FlowHandlebars.prototype.ifCond = function ( value, operator, value2, options ) {
		if ( operator === 'or' ) {
			return value || value2 ? options.fn( this ) : options.inverse( this );
		} else if ( operator === '===' ) {
			return value === value2 ? options.fn( this ) : options.inverse( this );
		} else if ( operator === '!==' ) {
			return value !== value2 ? options.fn( this ) : options.inverse( this );
		} else {
			return '';
		}
	};

	/**
	 * Returns the provided content as a plaintext string. Commonly for
	 * injecting into an i18n message.
	 *
	 * @param {string} contentFormat html|wikitext|plaintext
	 * @param {string} content
	 * @return {string} plaintext
	 */
	FlowHandlebars.prototype.plaintextSnippet = function ( contentFormat, content ) {
		var retval;
		if ( contentFormat === 'html' ) {
			retval = $( content ).text();
		} else {
			// @todo handle wikitext -> plaintext?
			retval = content;
		}

		return retval ? $.trim( retval ).substr( 0, 200 ) : '';
	};

	/**
	 * Outputs debugging information
	 *
	 * For development use only
	 */
	FlowHandlebars.prototype.debug = function () {
		mw.flow.debug( '[Handlebars] debug', arguments );
	};

	// Register helpers
	Handlebars.registerHelper( 'l10n', FlowHandlebars.prototype.l10n );
	Handlebars.registerHelper( 'l10nParse', FlowHandlebars.prototype.l10nParse );
	Handlebars.registerHelper( 'uuidTimestamp', FlowHandlebars.prototype.uuidTimestamp );
	Handlebars.registerHelper( 'timestamp', FlowHandlebars.prototype.timestamp );
	Handlebars.registerHelper( 'html', FlowHandlebars.prototype.html );
	Handlebars.registerHelper( 'block', FlowHandlebars.prototype.workflowBlock );
	Handlebars.registerHelper( 'post', FlowHandlebars.prototype.postBlock );
	Handlebars.registerHelper( 'eachPost', FlowHandlebars.prototype.eachPost );
	Handlebars.registerHelper( 'math', FlowHandlebars.prototype.math );
	Handlebars.registerHelper( 'progressiveEnhancement', FlowHandlebars.prototype.progressiveEnhancement );
	Handlebars.registerHelper( 'ifAnonymous', FlowHandlebars.prototype.ifAnonymous );
	Handlebars.registerHelper( 'linkWithReturnTo', FlowHandlebars.prototype.linkWithReturnTo );
	Handlebars.registerHelper( 'escapeContent', FlowHandlebars.prototype.escapeContent );
	Handlebars.registerHelper( 'tooltip', FlowHandlebars.prototype.tooltip );
	Handlebars.registerHelper( 'moderationAction', FlowHandlebars.prototype.moderationAction );
	Handlebars.registerHelper( 'concat', FlowHandlebars.prototype.concat );
	Handlebars.registerHelper( 'ifCond', FlowHandlebars.prototype.ifCond );
	Handlebars.registerHelper( 'plaintextSnippet', FlowHandlebars.prototype.plaintextSnippet );
	Handlebars.registerHelper( 'debug', FlowHandlebars.prototype.debug );

}( jQuery ) );
