jQuery( function( $ ) {
	'use strict';

	var $editor = $( '#post-body-content' ),
		$overlay = $( document.createElement( 'DIV' ) ),
		$slug = $( '#edit-slug-box' ),
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
		faded, editorRect, x, y;

	$( document.body ).append( $overlay );

	$overlay.hide().css( {
		position: 'fixed',
		top: $( '#wpadminbar' ).height(),
		right: 0,
		bottom: 0,
		left: 0,
		'z-index': 997
	} );

	function fadeOut() {
		if ( ! faded ) {
			faded = true;

			$slug.fadeTo( 'slow', 0.2 );

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
				} )
				// Fade in when the mouse moves away form the editor area.
				// Let's confirm this by checking 8 times. Mouse movement is very sensitive.
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

							if ( tick > 8 ) {
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
		if ( faded ) {
			faded = false;

			$slug.fadeTo( 'slow', 1 );

			$menu.animate( { left: 0 }, 'slow' );

			if ( $screenMeta.is( ':visible' ) ) {
				$screenMetaLinks.add( $screenMeta ).fadeTo( 'slow', 1 );
			} else {
				$screenMetaLinks.animate( { top: 0 }, 'slow' );
			}

			$fadeIn.fadeTo( 'slow', 1 );

			$overlay.hide().off( 'mouseenter.focus mousemove.focus touchstart.focus' );
		}
	}

	// Fade out when the title or editor is focussed/clicked.
	$( '#title' ).add( '#content' ).on( 'focus.focus click.focus touchstart.focus', fadeOut );
	$( document ).on( 'tinymce-editor-focus.focus', fadeOut );

	// Fade in the slug area when hovered.

	$slug.on( 'mouseenter.focus', function() {
		faded && $slug.fadeTo( 'fast', 1 );
	} ).on( 'mouseleave.focus', function() {
		faded && $slug.fadeTo( 'fast', 0.2 );
	} );
} );
