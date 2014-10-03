( function( mce, $ ) {
	'use strict';

	mce.PluginManager.add( 'wpfullscreen', function( editor ) {
		if ( editor.id === 'content' ) {
			editor.on( 'click focus', function() {
				$( document ).triggerHandler( 'tinymce-editor-focus', [ editor ] );
			} );
		}
	} );

} )( tinymce, jQuery );
