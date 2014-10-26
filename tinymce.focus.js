( function( mce, $ ) {
	'use strict';

	mce.PluginManager.add( 'focus', function( editor ) {
		$( document ).triggerHandler( 'tinymce-editor-setup', [ editor ] );
	} );
} )( window.tinymce, window.jQuery );
