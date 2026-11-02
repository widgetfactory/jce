<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

$theme 	= $this->get('theme');
$caller = $this->get('caller');
$name   = $this->get('name');

if ($caller) {
	$name .= '.' . $caller;
}

?>
<!DOCTYPE html>
<html lang="<?php echo $this->language; ?>" dir="<?php echo $this->direction; ?>">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<?php if ($theme == 'uk-jce-theme-auto') : ?>
		<script>
			// use the color scheme of the parent page, eg: Joomla Atum
			try {
				var scheme = window.parent.document.documentElement.getAttribute('data-bs-theme');

				if (scheme) {
					document.documentElement.setAttribute('data-bs-theme', scheme);
				}
			} catch (e) {}
		</script>
		<?php endif; ?>
		<!-- [head] -->
	</head>
	<body lang="<?php echo $this->language; ?>" id="jce" class="uk-jce <?php echo $theme; ?> uk-form uk-form-horizontal" data-plugin="<?php echo $name; ?>">
		<!-- [body] -->
	</body>
</html>
