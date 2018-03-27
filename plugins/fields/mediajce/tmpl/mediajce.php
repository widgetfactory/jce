<?php
/**
 * @package     Joomla.Plugin
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2018 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2018 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('_JEXEC') or die;

if ($field->value == '')
{
	return;
}

$class = $fieldParams->get('media_class');
$type  = $fieldParams->get('mediatype');

if ($class)
{
	$class = ' class="' . htmlentities($class, ENT_COMPAT, 'UTF-8', true) . '"';
}

$value  = (array) $field->value;
$buffer = '';

$element = '<img src="%s"%s alt="" />';

if ($type !== "images") {
    $element = '<a href="%s"%s>%s</a>';
}

foreach ($value as $path)
{
	if (!$path)
	{
		continue;
	}

	$buffer .= sprintf($element,
		htmlentities($path, ENT_COMPAT, 'UTF-8', true),
        $class,
        basename($path)
	);
}

echo $buffer;
