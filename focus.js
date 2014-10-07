window.jQuery( function( $ ) {
	'use strict';

	var $window = $( window ),
		$document = $( document ),
		$wrap = $( '#wpwrap' ),
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
		buffer = 20,
		tick = 0,
		faded, fadedSlug, editorRect, x, y, mouseY;

	$( document.body ).append( $overlay );

	$overlay.hide().css( {
		position: 'fixed',
		top: $( '#wpadminbar' ).height(),
		right: 0,
		bottom: 0,
		left: 0,
		'z-index': 997
	} );

	$window.on( 'mousemove.focus', function( event ) {
		mouseY = event.pageY;
	} );

	function fadeOut() {
		fadeOutSlug();

		if ( ! faded ) {
			faded = true;

			$menu.animate( { left: -$menu.width() }, 'slow' );

			if ( $screenMeta.is( ':visible' ) ) {
				$screenMetaLinks.add( $screenMeta ).fadeTo( 'slow', 0 );
			} else {
				$screenMetaLinks.animate( { top: -$screenMetaLinks.height() }, 'slow' );
			}

			$fadeIn = $fadeOut.filter( ':visible' ).fadeTo( 'slow', 0 );

			$editor.css( {
				position: 'relative',
				'z-index': 998
			} );

			$overlay.show()
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
					$window.off( 'scroll.focus' );
				} )
				// Fade in when the mouse moves away form the editor area.
				// Let's confirm this by checking 2 times. Mouse movement is very sensitive.
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

							if ( tick > 1 ) {
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
		}
	}

	function fadeIn() {
		fadeInSlug();

		if ( faded ) {
			faded = false;

			$menu.animate( { left: 0 }, 400 );

			if ( $screenMeta.is( ':visible' ) ) {
				$screenMetaLinks.add( $screenMeta ).fadeTo( 400, 1 );
			} else {
				$screenMetaLinks.animate( { top: 0 }, 400 );
			}

			$fadeIn.fadeTo( 400, 1 );

			$overlay.hide().off( 'mouseenter.focus mouseleave.focus mousemove.focus touchstart.focus' );

			$window.off( 'scroll.focus' );
		}
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

	function fadeOutSlug() {
		if ( ! fadedSlug && ! $slug.find( ':focus').length ) {
			fadedSlug = true;

			$slug.fadeTo( 'fast', 0.3 ).on( 'mouseenter.focus', fadeInSlug ).off( 'mouseleave.focus' );

			$slugFocusEl.on( 'focus.focus', fadeInSlug );
		}
	}

	function fadeInSlug() {
		if ( fadedSlug ) {
			fadedSlug = false;

			$slug.fadeTo( 'fast', 1 ).on( 'mouseleave.focus', fadeOutSlug ).off( 'mouseenter.focus' );

			$slugFocusEl.off( 'focus.focus' );
		}
	}

	$title.add( $content ).on( 'focus.focus click.focus touchstart.focus keyup.focus', fadeOut ).on( 'blur', maybeFadeIn );

	$document.on( 'tinymce-editor-init.focus', function( event, editor ) {
		if ( editor.id === 'content' ) {
			editor.on( 'click focus keyup', fadeOut );
			editor.on( 'blur', maybeFadeIn );
		}
	} );
} );
