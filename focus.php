<?php

/*
Plugin Name: Focus
Plugin URI: https://github.com/avryl/focus
Description: Focus.
Author: Janneke Van Dorpe
Author URI: http://profiles.wordpress.org/avryl/
Version: 0.2.8
Text Domain: focus
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

if ( is_admin() && ! class_exists( 'Focus' ) ) {
	class Focus {
		const VERSION = '0.2.8';
		const MIN_WP_VERSION = '4.1-alpha';

		function __construct() {
			global $wp_version;

			$version = str_replace( '-src', '', $wp_version );

			if ( empty( $version ) || version_compare( $version, self::MIN_WP_VERSION, '<' ) ) {
				return add_action( 'admin_notices', array( $this, 'admin_notices' ) );
			}

			add_action( 'load-post.php', array( $this, 'load' ) );
			add_action( 'load-post-new.php', array( $this, 'load' ) );
		}

		function admin_notices() {
			echo '<div class="error"><p><strong>Focus</strong> only works with WordPress version ' . self::MIN_WP_VERSION . ' or higher.</p></div>';
		}

		function load() {
			if ( wp_is_mobile() ) {
				add_filter( 'tiny_mce_before_init', array( $this, 'mce_remove_fullscreen_button' ) );
				add_filter( 'quicktags_settings', array( $this, 'qt_remove_fullscreen_button' ) );
			} else {
				add_filter( 'mce_css', array( $this, 'css' ) );
				add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
				add_action( 'mce_external_plugins', array( $this, 'external_plugins' ) );
				add_action( 'tiny_mce_plugins', array( $this, 'plugins' ) );
			}
		}

		function mce_remove_fullscreen_button( $config ) {
			$buttons = explode( ',', $config[ 'toolbar1' ] );
			$buttons = array_diff( $buttons, array( 'wp_fullscreen' ) );

			$config[ 'toolbar1' ] = implode( ',', $buttons );

			return $config;
		}

		function qt_remove_fullscreen_button( $config ) {
			$buttons = explode( ',', $config[ 'buttons' ] );
			$buttons = array_diff( $buttons, array( 'fullscreen' ) );

			$config[ 'buttons' ] = implode( ',', $buttons );

			return $config;
		}

		function css( $css ) {
			$css = explode( ',', $css );
			array_push( $css, plugins_url( 'tinymce.focus.css?v=' . ( defined( 'WP_DEBUG' ) && WP_DEBUG ? urlencode( time() ) : self::VERSION ), __FILE__ ) );

			return implode( ',', $css );
		}

		function enqueue_scripts() {
			wp_deregister_script( 'wp-fullscreen' );
			wp_deregister_script( 'editor-expand' );
			wp_enqueue_script( 'editor-expand', plugins_url( 'editor-expand.js', __FILE__ ), array( 'jquery' ), self::VERSION, true );
			wp_enqueue_script( 'focus', plugins_url( 'focus.js', __FILE__ ), array( 'jquery' ), self::VERSION, true );

			wp_enqueue_style( 'focus', plugins_url( 'focus.css', __FILE__ ), array(), self::VERSION );
		}

		function external_plugins( $plugins ) {
			$plugins['focus'] = plugins_url( 'tinymce.focus.js?v=' . self::VERSION, __FILE__ );
			$plugins['wpautoresize'] = plugins_url( 'tinymce.autoresize.js?v=' . self::VERSION, __FILE__ );

			return $plugins;
		}

		function plugins( $plugins ) {
			return array_diff( $plugins, array( 'wpautoresize' ) );
		}
	}

	new Focus;
}
