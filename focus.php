<?php

/*
Plugin Name: Focus
Plugin URI: https://github.com/avryl/focus
Description: Focus.
Author: Janneke Van Dorpe
Author URI: http://profiles.wordpress.org/avryl/
Version: 0.2
Text Domain: focus
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

if ( is_admin() && ! class_exists( 'Focus' ) ) {
	class Focus {
		function __construct() {
			add_action( 'load-post.php', array( $this, 'load' ) );
			add_action( 'load-post-new.php', array( $this, 'load' ) );
		}

		function load() {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'tiny_mce_plugins', array( $this, 'plugins' ) );
			add_action( 'mce_external_plugins', array( $this, 'external_plugins' ) );
		}

		function enqueue_scripts() {
			wp_deregister_script( 'wp-fullscreen' );

			wp_enqueue_style( 'focus', plugins_url( 'focus.css', __FILE__ ) );
			wp_enqueue_script( 'wp-fullscreen', plugins_url( 'focus.js', __FILE__ ), array( 'jquery' ), '0.2', true );
		}

		function plugins( $plugins ) {
			return array_diff( $plugins, array( 'wpfullscreen' ) );
		}

		function external_plugins( $plugins ) {
			$plugins['wpfullscreen'] = plugins_url( 'tinymce.focus.js', __FILE__ );

			return $plugins;
		}
	}

	new Focus;
}
