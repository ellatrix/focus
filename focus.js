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
		isActive = window.getUserSetting( 'editor_expand' ) === 'on',
		isOn = isActive ? dfw ? !! parseInt( dfw, 10 ) : true : false,
		traveledX = 0,
		traveledY = 0,
		buffer = 20,
		faded, fadedAdminBar, fadedSlug,
		editorRect, x, y, mouseY, scrollY, button,
		focusLostTimer, overlayTimer, editorHasFocus;

	$body.append( $overlay );

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

	function activate() {
		if ( ! isActive ) {
			isActive = true;

			button.disabled( false );
		}
	}

	function deactivate() {
		if ( isActive ) {
			off();

			isActive = false;

			button.disabled( true );
		}
	}

	function on() {
		if ( ! isOn && isActive ) {
			isOn = true;

			mceBind();

			$content.on( 'keydown.focus', fadeOut );

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
		var key = event && event.keyCode;

		if ( key === 27 ) {
			fadeIn();
			return;
		}

		if ( event.metaKey || ( event.ctrlKey && ! event.altKey ) || ( key && (
			// Special keys ( tab, ctrl, alt, esc, arrow keys... )
			( key <= 47 && key !== 8 && key !== 13 && key !== 32 && key !== 46 ) ||
			// Windows keys
			( key >= 91 && key <= 93 ) ||
			// F keys
			( key >= 112 && key <= 135 ) ||
			// Num Lock, Scroll Lock, OEM
			( key >= 144 && key <= 150 ) ||
			// OEM or non-printable
			key >= 224
		) ) ) {
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
						var nScrollY = window.pageYOffset;

						if ( (
							scrollY && mouseY &&
							scrollY !== nScrollY
						) && (
							mouseY < editorRect.top - buffer ||
							mouseY > editorRect.bottom + buffer
						) ) {
							fadeIn();
						}

						scrollY = nScrollY;
					} );
				} )
				.on( 'mouseleave.focus', function() {
					x = y =  null;
					traveledX = traveledY = 0;

					$window.off( 'scroll.focus' );
				} )
				// Fade in when the mouse moves away form the editor area.
				.on( 'mousemove.focus', function( event ) {
					var nx = event.pageX,
						ny = event.pageY;

					if ( x && y && ( nx !== x || ny !== y ) ) {
						if (
							( ny <= y && ny < editorRect.top ) ||
							( ny >= y && ny > editorRect.bottom ) ||
							( nx <= x && nx < editorRect.left ) ||
							( nx >= x && nx > editorRect.right )
						) {
							traveledX += Math.abs( x - nx );
							traveledY += Math.abs( y - ny );

							if ( (
								ny <= editorRect.top - buffer ||
								ny >= editorRect.bottom + buffer ||
								nx <= editorRect.left - buffer ||
								nx >= editorRect.right + buffer
							) && (
								traveledX > 10 ||
								traveledY > 10
							) ) {
								fadeIn();

								x = y =  null;
								traveledX = traveledY = 0;

								return;
							}
						} else {
							traveledX = traveledY = 0;
						}
					}

					x = nx;
					y = ny;
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
			classes: 'wp-fullscreen btn widget',
			disabled: ! isActive,
			onclick: toggle,
			onPostRender: function() {
				button = this;
			},
			tooltip: 'Distraction Free Writing'
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
				editor.on( 'keydown', fadeOut );
				editor.on( 'blur', maybeFadeIn );
				editor.on( 'focus', focus );
				editor.on( 'blur', blur );
			};

			mceUnbind = function() {
				button.active( false );
				editor.off( 'keydown', fadeOut );
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

	$document.on( 'editor-expand-on.focus', activate ).on( 'editor-expand-off.focus', deactivate );

	if ( isOn ) {
		$content.on( 'keydown.focus', fadeOut );

		$title.add( $content ).on( 'blur.focus', maybeFadeIn );
	}

	$( '#save-post' ).on( 'click', function( event ) {
		var wp = window.wp;

		if ( wp && wp.autosave ) {
			wp.autosave.server.triggerSave();
		}

		event.preventDefault();
	} );
} );
