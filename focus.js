window.jQuery( function( $ ) {
	'use strict';

	var $window = $( window ),
		$document = $( document ),
		$body = $( document.body ),
		$wrap = $( '#wpcontent' ),
		$adminBar = $( '#wpadminbar' ),
		$editor = $( '#post-body-content' ),
		$title = $( '#title' ),
		$content = $( '#content' ),
		$overlay = $( document.createElement( 'DIV' ) ),
		$slug = $( '#edit-slug-box' ),
		$slugFocusEl = $slug.find( 'a' )
			.add( $slug.find( 'button' ) )
			.add( $slug.find( 'input' ) ),
		$menuWrap = $( '#adminmenuwrap' ),
		$footer = $( '#wpfooter' ),
		$textButton = $(),
		$editorWindow = $(),
		$editorIframe = $(),
		mceBind = function() {},
		mceUnbind = function() {},
		dfw = window.getUserSetting( 'dfw' ),
		isOn = dfw ? !! parseInt( dfw, 10 ) : true,
		tick = 0,
		buffer = 20,
		faded, fadedAdminBar, fadedSlug,
		editorRect, x, y, mouseY, button,
		focusLostTimer, overlayTimer, editorHasFocus;

	$( document.body ).append( $overlay );

	$overlay.css( {
		display: 'none',
		position: 'fixed',
		top: $adminBar.height(),
		right: 0,
		bottom: 0,
		left: 0,
		'z-index': 9997
	} );

	$editor.css( {
		position: 'relative'
	} );

	// Wait for quicktags to initialize.
	setTimeout( function() {
		$textButton = $( '#qt_content_fullscreen' ).toggleClass( 'active', isOn ).on( 'click.focus', toggle );
	}, 300 );

	$window.on( 'mousemove.focus', function( event ) {
		mouseY = event.pageY;
	} );

	function on() {
		if ( ! isOn ) {
			isOn = true;

			mceBind();

			$content.on( 'keyup.focus', fadeOut );

			$title.add( $content ).on( 'blur.focus', maybeFadeIn );

			fadeOut();

			window.setUserSetting( 'dfw', '1' );

			$textButton.addClass( 'active' );
		}
	}

	function off() {
		if ( isOn ) {
			isOn = false;

			mceUnbind();

			$title.add( $content ).off( '.focus' );

			fadeIn();

			$editor.off( '.focus' );

			window.setUserSetting( 'dfw', '0' );

			$textButton.removeClass( 'active' );
		}
	}

	function toggle() {
		( isOn ? off : on )();
	}

	function fadeOut( event ) {
		if ( event && event.keyCode === 9 ) {
			return;
		}

		if ( ! faded ) {
			faded = true;

			clearTimeout( overlayTimer );

			overlayTimer = setTimeout( function() {
				$overlay.show();
			}, 600 );

			$editor.css( 'z-index', 9998 );

			$overlay
				// Always recalculate the editor area entering the overlay with the mouse.
				.on( 'mouseenter.focus', function() {
					editorRect = $editor.offset();
					editorRect.right = editorRect.left + $editor.outerWidth();
					editorRect.bottom = editorRect.top + $editor.outerHeight();

					$window.on( 'scroll.focus', function() {
						if ( mouseY && ( mouseY < editorRect.top - buffer || mouseY > editorRect.bottom + buffer ) ) {
							fadeIn();
						}
					} );
				} )
				.on( 'mouseleave.focus', function() {
					tick = 0;

					$window.off( 'scroll.focus' );
				} )
				// Fade in when the mouse moves away form the editor area.
				// Let's confirm this by checking 4 times. Mouse movement is very sensitive.
				// Also don't fade in when we are less than buffer * 1px away from the editor area.
				.on( 'mousemove.focus', function( event ) {
					var _x = event.pageX,
						_y = event.pageY;

					if ( x && y && ( _x !== x || _y !== y ) ) {
						if (
							( _y <= y && _y < editorRect.top ) ||
							( _y >= y && _y > editorRect.bottom ) ||
							( _x <= x && _x < editorRect.left ) ||
							( _x >= x && _x > editorRect.right )
						) {
							tick++;

							if (
								_y >= editorRect.top - buffer &&
								_y <= editorRect.bottom + buffer &&
								_x >= editorRect.left - buffer &&
								_x <= editorRect.right + buffer
							) {
								return;
							}

							if ( tick > 3 ) {
								fadeIn();

								x = y = null;
								tick = 0;

								return;
							}
						}
					}

					x = _x;
					y = _y;
				} )
				// When the overlay is touched, always fade in and cancel the event.
				.on( 'touchstart.focus', function( event ) {
					event.preventDefault();
					fadeIn();
				} );

			$editor.off( 'mouseenter.focus' );

			if ( focusLostTimer ) {
				clearTimeout( focusLostTimer );
				focusLostTimer = null;
			}

			$menuWrap.off( 'mouseenter.focus' );

			$body.addClass( 'focus-on' ).removeClass( 'focus-off' );
		}

		fadeOutAdminBar();
		fadeOutSlug();
	}

	function fadeIn() {
		if ( faded ) {
			faded = false;

			clearTimeout( overlayTimer );

			overlayTimer = setTimeout( function() {
				$overlay.hide();
			}, 200 );

			$editor.css( 'z-index', '' );

			$overlay.off( 'mouseenter.focus mouseleave.focus mousemove.focus touchstart.focus' );

			$editor.on( 'mouseenter.focus', function() {
				if ( $.contains( $editor.get( 0 ), document.activeElement ) || editorHasFocus ) {
					fadeOut();
				}
			} );

			focusLostTimer = setTimeout( function() {
				focusLostTimer = null;
				$editor.off( 'mouseenter.focus' );
			}, 1000 );

			$menuWrap.on( 'mouseenter.focus', function() {
				if ( focusLostTimer ) {
					clearTimeout( focusLostTimer );
					focusLostTimer = null;
				}

				$editor.off( 'mouseenter.focus' );
			} );

			$body.addClass( 'focus-off' ).removeClass( 'focus-on' );
		}

		fadeInAdminBar();
		fadeInSlug();
	}

	function maybeFadeIn() {
		setTimeout( function() {
			var position = document.activeElement.compareDocumentPosition( $editor.get( 0 ) );

			function hasFocus( $el ) {
				return $.contains( $el.get( 0 ), document.activeElement );
			}

			// The focussed node is before or behind the editor area, and not ouside the wrap.
			if ( ( position === 2 || position === 4 ) && ( hasFocus( $menuWrap ) || hasFocus( $wrap ) || hasFocus( $footer ) ) ) {
				fadeIn();
			}
		}, 0 );
	}

	function fadeOutAdminBar() {
		if ( ! fadedAdminBar && faded ) {
			fadedAdminBar = true;

			$adminBar
				.on( 'mouseenter.focus', function() {
					$adminBar.addClass( 'focus-off' );
				} )
				.on( 'mouseleave.focus', function() {
					$adminBar.removeClass( 'focus-off' );
				} );
		}
	}

	function fadeInAdminBar() {
		if ( fadedAdminBar ) {
			fadedAdminBar = false;

			$adminBar.off( '.focus' );
		}
	}

	function fadeOutSlug() {
		if ( ! fadedSlug && faded && ! $slug.find( ':focus').length ) {
			fadedSlug = true;

			$slug.stop().fadeTo( 'fast', 0.3 ).on( 'mouseenter.focus', fadeInSlug ).off( 'mouseleave.focus' );

			$slugFocusEl.on( 'focus.focus', fadeInSlug ).off( 'blur.focus' );
		}
	}

	function fadeInSlug() {
		if ( fadedSlug ) {
			fadedSlug = false;

			$slug.stop().fadeTo( 'fast', 1 ).on( 'mouseleave.focus', fadeOutSlug ).off( 'mouseenter.focus' );

			$slugFocusEl.on( 'blur.focus', fadeOutSlug ).off( 'focus.focus' );
		}
	}

	$document.on( 'tinymce-editor-setup.focus', function( event, editor ) {
		editor.addButton( 'wp_fullscreen', {
			tooltip: 'Distraction Free Writing',
			onclick: toggle,
			classes: 'wp-fullscreen btn widget',
			onPostRender: function() {
				button = this;
			}
		} );
	} );

	$document.on( 'tinymce-editor-init.focus', function( event, editor ) {
		function focus() {
			editorHasFocus = true;
		}

		function blur() {
			editorHasFocus = false;
		}

		if ( editor.id === 'content' ) {
			$editorWindow = $( editor.getWin() );
			$editorIframe = $( editor.getContentAreaContainer() ).find( 'iframe' );

			mceBind = function() {
				button.active( true );
				editor.on( 'keyup', fadeOut );
				editor.on( 'blur', maybeFadeIn );
				editor.on( 'focus', focus );
				editor.on( 'blur', blur );
			};

			mceUnbind = function() {
				button.active( false );
				editor.off( 'keyup', fadeOut );
				editor.off( 'blur', maybeFadeIn );
				editor.off( 'focus', focus );
				editor.off( 'blur', blur );
			};

			if ( isOn ) {
				mceBind();
			}

			// Make sure the body focusses when clicking outside it.
			editor.on( 'click', function( event ) {
				if ( event.target === editor.getDoc().documentElement ) {
					editor.focus();
				}
			} );
		}
	} );

	if ( isOn ) {
		$content.on( 'keyup.focus', fadeOut );

		$title.add( $content ).on( 'blur.focus', maybeFadeIn );
	}
} );
