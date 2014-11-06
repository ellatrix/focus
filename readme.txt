=== Focus ===

Contributors: avryl, markjaquith, azaozz, wordpressdotorg
Requires at least: 4.0
Tags: TinyMCE, editor, focus
Tested up to: 4.1
Stable tag: 0.2.8
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

== Description ==

Focus.

== Changelog ==

= 0.2.8 =

* For some reason the wpautoresize plugin wasn't patched.
* Also disable button in text editor when turning off editor expand. Emit event for (de)activating, on and off.
* Remove ajax save.
* Fade admin bar to 30% instead of fading it entirely. Fixes #37.
* Ran CSS through autoprefixer with WP config. Fixes #38.
* Set default for the editor expand setting. Fixes #35.
* Require WP 4.1-alpha.
* Don't clear the timer when hovering over the menu. Fixes #34.
