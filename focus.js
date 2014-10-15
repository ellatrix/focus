window.jQuery( function( $ ) {
	'use strict';

	var $window = $( window ),
		$document = $( document ),
		$wrap = $( '#wpwrap' ),
		$adminBar = $( '#wp-toolbar' ),
		$editor = $( '#post-body-content' ),
		$title = $( '#title' ),
		$content = $( '#content' ),
		$overlay = $( document.createElement( 'DIV' ) ),
		$slug = $( '#edit-slug-box' ),
		$slugFocusEl = $slug.find( 'a' )
			.add( $slug.find( 'button' ) )
			.add( $slug.find( 'input' ) ),
		$menu = $( '#adminmenuwrap' ).add( '#adminmenuback' ),
		$screenMeta = $( '#screen-meta' ),
		$screenMetaLinks = $( '#screen-meta-links' ).children(),
		$fadeOut = $( '.wrap' ).children( 'h2' )
			.add( '#wpfooter' )
			.add( '.postbox-container' )
			.add( 'div.updated' )
			.add( 'div.error' ),
		$fadeIn = $(),
		$textButton = $(),
		$editorWindow = $(),
		$upperToolbar = $( '#wp-content-media-buttons' ),
		$upperToolbarTabs = $editor.find( '.wp-editor-tabs' ).children( 'a' ),
		$visualToolbar = $(),
		$textToolbar = $( '#ed_toolbar' ).children(),
		mceBind = function() {},
		mceUnbind = function() {},
		dfw = window.getUserSetting( 'dfw' ),
		isOn = dfw ? !! parseInt( dfw, 10 ) : true,
		tick = 0,

		buffer = 20,

		fadeInTime = 400,
		fadeOutTime = 600,

		slide = true,

		faded, fadedAdminBar, fadedSlug, fadedButtons, editorRect, x, y, mouseY, button, timer, buttonsTimer, editorHasFocus;

	$upperToolbarTabs.wrapInner( '<span>' );
	$upperToolbar = $upperToolbar.add( $upperToolbarTabs.children() );

	$( document.body ).append( $overlay );

	$overlay.css( {
		background: slide ? null : '#f1f1f1',
		display: 'none',
		position: 'fixed',
		top: $( '#wpadminbar' ).height(),
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

			$title.add( $content )
				.on( 'click.focus touchstart.focus keyup.focus', fadeOut )
				.on( 'focus.focus', maybeFadeOut )
				.on( 'blur.focus', maybeFadeIn );

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

			if ( slide ) {
				$menu.stop().animate( { left: -$menu.width() }, fadeOutTime );

				if ( $screenMeta.is( ':visible' ) ) {
					$screenMetaLinks.add( $screenMeta ).stop().fadeTo( fadeOutTime, 0 );
				} else {
					$screenMetaLinks.stop().animate( { top: -$screenMetaLinks.height() }, fadeOutTime );
				}

				$fadeIn = $fadeOut.filter( ':visible' ).stop().fadeTo( fadeOutTime, 0 );

				$overlay.show();
			} else {
				$overlay.stop().fadeIn( fadeOutTime );
			}

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

			$window.add( $editorWindow ).on( 'mousemove.focus', maybeFadeButtons );
		}

		fadeOutAdminBar();
		fadeOutSlug();
		fadeOutButtons();
	}

	function fadeIn() {
		if ( faded ) {
			faded = false;

			if ( slide ) {
				$menu.stop().animate( { left: 0 }, fadeInTime );

				if ( $screenMeta.is( ':visible' ) ) {
					$screenMetaLinks.add( $screenMeta ).stop().fadeTo( fadeInTime, 1 );
				} else {
					$screenMetaLinks.stop().animate( { top: 0 }, fadeInTime );
				}

				$fadeIn.stop().fadeTo( fadeInTime, 1 );

				$overlay.hide();

				$editor.css( 'z-index', '' );
			} else {
				$overlay.stop().fadeOut( fadeInTime, function() {
					$editor.css( 'z-index', '' );
				} );
			}

			$overlay.off( 'mouseenter.focus mouseleave.focus mousemove.focus touchstart.focus' );

			$window.add( $editorWindow ).off( '.focus' );

			buttonsTimer && clearTimeout( buttonsTimer );

			$editor.on( 'mouseenter.focus', function() {
				if ( $.contains( $editor.get( 0 ), document.activeElement ) || editorHasFocus ) {
					fadeOut();
				}
			} );
		}

		fadeInAdminBar();
		fadeInSlug();
		fadeInButtons();
	}

	function maybeFadeOut( event ) {
		timer && clearTimeout( timer );

		timer = setTimeout( function() {
			timer = null;

			if ( event.target === document.activeElement || ( event.target.id === 'content' && editorHasFocus ) ) {
				fadeOut();
			}
		}, 1000 );
	}

	function maybeFadeIn() {
		setTimeout( function() {
			var position = document.activeElement.compareDocumentPosition( $editor.get( 0 ) );

			// The focussed node is before or behind the editor area, and not ouside the wrap.
			if ( ( position === 2 || position === 4 ) && $.contains( $wrap.get( 0 ), document.activeElement ) ) {
				fadeIn();
			}
		}, 0 );
	}

	function fadeOutAdminBar() {
		if ( ! fadedAdminBar && faded ) {
			fadedAdminBar = true;

			$adminBar.stop().fadeTo( fadeOutTime, 0.3 ).on( 'mouseenter.focus', fadeInAdminBar ).off( 'mouseleave.focus' );
		}
	}

	function fadeInAdminBar() {
		if ( fadedAdminBar ) {
			fadedAdminBar = false;

			$adminBar.stop().fadeTo( fadeInTime, 1 ).on( 'mouseleave.focus', fadeOutAdminBar ).off( 'mouseenter.focus' );
		}
	}

	function fadeOutSlug() {
		if ( ! fadedSlug && faded && ! $slug.find( ':focus').length ) {
			fadedSlug = true;

			$slug.stop().fadeTo( 'fast', 0.3 ).on( 'mouseenter.focus', fadeInSlug ).off( 'mouseleave.focus' );

			$slugFocusEl.on( 'focus.focus', fadeInSlug );
		}
	}

	function fadeInSlug() {
		if ( fadedSlug ) {
			fadedSlug = false;

			$slug.stop().fadeTo( 'fast', 1 ).on( 'mouseleave.focus', fadeOutSlug ).off( 'mouseenter.focus' );

			$slugFocusEl.off( 'focus.focus' );
		}
	}

	function maybeFadeButtons() {
		if ( buttonsTimer ) {
			clearTimeout( buttonsTimer );
		} else {
			fadeInButtons();
		}

		buttonsTimer = setTimeout( function() {
			buttonsTimer = null;

			fadeOutButtons();
		}, 1000 );
	}

	function fadeOutButtons() {
		if ( ! fadedButtons ) {
			fadedButtons = true;

			$upperToolbar.add( $visualToolbar ).add( $textToolbar ).stop().fadeTo( fadeOutTime, 0.3 );
		}
	}

	function fadeInButtons() {
		if ( fadedButtons ) {
			fadedButtons = false;

			$upperToolbar.add( $visualToolbar ).add( $textToolbar ).stop().fadeTo( fadeInTime, 1 );
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
			$visualToolbar = $editor.find( '.mce-toolbar-grp' ).children();

			mceBind = function() {
				button.active( true );
				editor.on( 'click keyup', fadeOut );
				editor.on( 'focus', maybeFadeOut );
				editor.on( 'blur', maybeFadeIn );
				editor.on( 'focus', focus );
				editor.on( 'blur', blur );
			};

			mceUnbind = function() {
				button.active( false );
				editor.off( 'click keyup', fadeOut );
				editor.off( 'focus', maybeFadeOut );
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
		$title.add( $content )
			.on( 'click.focus touchstart.focus keyup.focus', fadeOut )
			.on( 'focus.focus', maybeFadeOut )
			.on( 'blur.focus', maybeFadeIn );
	}
} );
