jQuery( function( $ ) {
	'use strict';

	var _ = window._,
		$window = $( window ),
		$document = $( document ),
		$editor = $( '#post-body-content' ),
		$title = $( '#title' ),
		$slug = $( '#edit-slug-box' ),
		$content = $( '#content' ),
		$menu = $( '#adminmenuwrap' ).add( '#adminmenuback' ),
		$out = $( '.wrap' ).children( 'h2' )
			.add( '#screen-meta-links' )
			.add( '#wpfooter' )
			.add( '#wpfooter' )
			.add( '.postbox-container' )
			.add( 'div.updated' )
			.add( 'div.error' ),
		$in = $(),
		buffer = 20,
		editorRect, faded, mouseY;

	getEditorRect();

	function getEditorRect() {
		var offset = $editor.offset();

		offset.right = offset.left + $editor.width() + buffer;
		offset.bottom = offset.top + $editor.height() + buffer;
		offset.left = offset.left - buffer;
		offset.top = offset.top - buffer;

		editorRect = offset;
	}

	function fadeOut() {
		if ( ! faded ) {
			faded = true;

			$in = $out.filter( ':visible' );

			$in.fadeTo( 'slow', 0 );
			$slug.fadeTo( 'slow', 0.2 );
			$menu.animate( { left: -$menu.width() }, 'slow' );

			getEditorRect();
		}
	}

	function fadeIn() {
		if ( faded ) {
			faded = false;

			$in.fadeTo( 'slow', 1 );
			$slug.fadeTo( 'slow', 1 );
			$menu.animate( { left: 0 }, 'slow' );
		}
	}

	// Fade out when the title or editor is focussed/clicked.
	$title.add( $content ).on( 'focus.focus click.focus', fadeOut );
	$document.on( 'tinymce-editor-focus.focus', fadeOut );

	// Fade in when the mouse moves AND the mouse is buffer x 1px outside the editor area.
	$window.on( 'mousemove.focus', function( event ) {
		var x = event.pageX,
			y = event.pageY;

		mouseY = event.clientY;

		if ( x < editorRect.left || x > editorRect.right || y < editorRect.top || y > editorRect.bottom ) {
			fadeIn();
		}
	} );

	// Fade in when the mouse scrolls buffer x 1px over the edge of the editor area.
	$window.on( 'scroll.focus', function() {
		var y = window.pageYOffset;

		if ( mouseY + y < editorRect.top || mouseY + y > editorRect.bottom ) {
			fadeIn();
		}
	} );

	// Fade in the slug area when hovered.

	$slug.on( 'mouseenter', function() {
		faded && $slug.fadeTo( 'fast', 1 );
	} ).on( 'mouseleave', function() {
		faded && $slug.fadeTo( 'fast', 0.2 );
	} );

	// Recalculate the editor area rectangle when the window or tinymce window resizes,
	// when the textarea resizes and when the menu collapses or amount of columns changes.

	$window.on( 'resize.focus', _.debounce( getEditorRect, 1000 ) );

	$document.on( 'tinymce-editor-init.focus', function( event, editor ) {
		if ( editor.id === 'content' ) {
			$( editor.getWin() ).on( 'resize.focus', _.debounce( getEditorRect, 200 ) );
		}
	} );

	$content.on( 'focus.focus input.focus propertychange.focus', function() {
		setTimeout( getEditorRect, 200 );
	} );

	$document.on( 'wp-collapse-menu.focus postboxes-columnchange.focus', getEditorRect );
} );
