( function( $ ) {
	'use strict';

	window.wp = wp || {};
	wp.editor = wp.editor || {};

	$( function() {
		var $document = $( document ),
			$body = $( document.body ),
			$collapseMenu = $( '#collapse-menu' ),
			$bar = $( '#wp-toolbar' ),
			$menu = $( '#adminmenuwrap' ),
			$boxes = $( '.postbox' ),
			$updated = $( 'div.updated' ),
			$errors = $( 'div.error' ),
			$title = $( '.wrap' ).children( 'h2' ).first(),
			$screenMetaLinks = $( '#screen-meta-links' ),
			$slug = $( '#edit-slug-box' ),
			$toFade = $bar.add( $menu ).add( $boxes ).add( $errors ).add( $slug ),
			$toHide = $collapseMenu.add( $title ).add( $screenMetaLinks ).add( $updated ),
			$button = $(),
			originalStates = {},
			visible = false,
			editorButton;

		setTimeout( function() {
			$button = $( '#qt_content_fullscreen' );
		}, 100 );

		function maybeToggleMenu() {
			var folded = $body.hasClass( 'folded' );

			function toggleMenu() {
				$( '#adminmenu' ).find( 'div.wp-submenu' ).css( 'margin-top', '' );
				$body.toggleClass( 'folded' );
				$document.trigger( 'wp-collapse-menu', { state: folded ? 'open' : 'folded' } );
			}

			if ( visible ) {
				originalStates.menu = folded ? 'folded' : 'open';
				! folded && toggleMenu();
			} else {
				folded && originalStates.menu !== 'folded' && toggleMenu();
			}
		}

		function maybeChangeColumns() {
			var holder = $( '.metabox-holder' ).get( 0 ),
				columns;

			if ( ! holder || ! window.postboxes ) {
				return;
			}

			columns = holder.className.match( /columns-(\d)+/ );

			if ( ! columns ) {
				return;
			}

			columns = columns[1];

			if ( visible ) {
				originalStates.columns = columns;
				columns === '2' && window.postboxes._pb_edit( 1 );
			} else {
				columns === '1' && originalStates.columns === '2' && window.postboxes._pb_edit( 2 );
			}
		}

		function maybeToggleScrolling() {
			if ( window.getUserSetting( 'editor_expand' ) === 'off' && window.editorExpand ) {
				window.editorExpand[ visible ? 'on' : 'off' ]();
			}
		}

		$document.on( 'tinymce-editor-setup', function( event, editor ) {
			editor.addButton( 'wp_fullscreen', {
				tooltip: 'Distraction Free Writing',
				shortcut: 'Alt+Shift+W',
				onclick: wp.editor.fullscreen.toggle,
				classes: 'wp-fullscreen btn widget', // This overwrites all classes on the container!
				onPostRender: function() {
					editorButton = this;
				}
			} );
		} );

		$document.on( 'keydown', function( event ) {
			if ( event.keyCode === 27 && visible ) {
				wp.editor.fullscreen.off();
			}
		});

		wp.editor.fullscreen = {
			opacity: 0.3,
			bind_resize: function() {},
			dfwWidth: function() {},
			fade: {
				In: function() {},
				Out: function() {},
				sensitivity: 100,
				transitions: true
			},
			off: function() {
				this.toggle();
			},
			on: function() {
				this.toggle();
			},
			toggle: function() {
				var self = this;

				visible = ! visible;

				maybeToggleMenu();
				maybeChangeColumns();
				maybeToggleScrolling();

				$toHide.toggle();

				if ( visible ) {
					$toFade
					.on( 'mouseenter.focus', function() {
						$( this ).fadeTo( 'fast' , 1 );
					} )
					.on( 'mouseleave.focus', function() {
						$( this ).fadeTo( 'fast' , self.opacity );
					} );
				} else {
					$toFade.off( '.focus' );
				}

				$toFade.filter( ':visible' ).fadeTo( 'slow' , visible ? this.opacity : 1 );

				editorButton && editorButton.active( visible );
				$button.toggleClass( 'active' );
			},
			pubsub: {
				publish: function() {},
				subscribe: function() {},
				topics: {
					hidden: [],
					hide: [],
					hiding: [],
					show: [],
					showing: [],
					shown: []
				},
				unsubscribe: function() {}
			},
			refreshButtons: function() {},
			resizeTextarea: function() {},
			save: function() {},
			settings: {
				id: '',
				mode: 'tinymce',
				timer: 0,
				title_id: '',
				toolbar_shown: true,
				visible: visible
			},
			switchmode: function() {},
			toggleUI: function() {},
			ui: {
				fade: function() {},
				init: function() {}
			}
		};
	} );
} )( jQuery );
