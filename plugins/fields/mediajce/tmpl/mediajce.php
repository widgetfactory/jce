<?php

/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Filesystem\File;
use Joomla\CMS\Filesystem\Path;
use Joomla\Utilities\ArrayHelper;
use Joomla\CMS\Layout\LayoutHelper;

// load helper
require_once JPATH_PLUGINS . '/fields/mediajce/helper/mediahelper.php';

if (empty($field->value) || empty($field->value['media_src'])) {
    return;
}

$data = array(
    'media_src' => '',
    'media_text' => (string) $fieldParams->get('media_description', ''),
    'media_type' => (string) $fieldParams->get('mediatype', 'embed'),
    'media_target' => (string) $fieldParams->get('media_target', '_blank'),
    'media_class' => (string) $fieldParams->get('media_class', ''),
    'media_caption' => '',
    'media_supported' => array('img', 'video', 'audio', 'iframe', 'a', 'object'),
);

foreach ($field->value as $key => $value) {
    if (empty($value)) {
        continue;
    }

    $data[$key] = $value;
}

// convert to object
$data = (object) $data;

// convert legacy value
if (isset($data->src)) {
    $data->media_src = $data->src;
}

// add "image" to supported media to allow for "image" and "img"
$data->media_supported[] = 'image';

// clean Joomla 4 media stuff
if ($pos = strpos($data->media_src, '#')) {
    $data->media_src = substr($data->media_src, 0, $pos);
}

// get file extension to determine tag
$extension = File::getExt($data->media_src);

// lowercase
$extension = strtolower($extension);

// get layout from extension
$layout = WfMediaHelper::getLayoutFromExtension($extension);

// reset layout as link
if (!in_array($layout, $data->media_supported) || $data->media_type == 'link') {
    $layout = 'link';
}

$attribs = array();

if ($data->media_class) {
    $data->media_class = preg_replace('#[^-\w ]#i', '', $data->media_class);
    $attribs['class'] = trim($data->media_class);
}

$text = '';

if ($data->media_text) {
    $text = htmlentities($data->media_text, ENT_COMPAT, 'UTF-8', true);
}

// links
if ($layout == 'link') {
    $attribs['title'] = $text;
}

// images
if ($layout == 'image') {
    $attribs['width'] = isset($data->media_width) ? $data->media_width : '';
    $attribs['height'] = isset($data->media_height) ? $data->media_height : '';
    $attribs['loading'] = 'lazy';

    if ($text) {
        $attribs['alt'] = $text;
    }
}

// audio
if ($layout == 'audio') {
    $attribs['controls'] = 'controls';

    if ($text) {
        $attribs['title'] = $text;
    }
}

// video
if ($layout == 'video') {
    $attribs['controls'] = 'controls';

    $attribs['width'] = isset($data->media_width) ? $data->media_width : '';
    $attribs['height'] = isset($data->media_height) ? $data->media_height : '';

    if ($text) {
        $attribs['title'] = $text;
    }
}

// object
if ($layout == 'object') {
    $attribs['width'] = isset($data->media_width) ? $data->media_width : '100%';
    $attribs['height'] = isset($data->media_height) ? $data->media_height : '100%';

    if ($text) {
        $attribs['title'] = $text;
    }

    $attribs['data'] = $data->media_src;

    $mimetype = WfMediaHelper::getMimeType($extension);

    if ($mimetype) {
        $attribs['type'] = $mimetype;
    } else {
        $layout = 'iframe';
    }
}

// iframe
if ($layout == 'iframe') {
    $attribs['frameborder'] = 0;
    $attribs['width'] = isset($data->media_width) ? $data->media_width : '100%';
    $attribs['height'] = isset($data->media_height) ? $data->media_height : '100%';
    $attribs['loading'] = 'lazy';

    if ($text) {
        $attribs['title'] = $text;
    }
}

$buffer = '';

// perform pcre replacement of common invalid characters
$path = preg_replace('#[\+\\\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]#u', '', $data->media_src);

// trim
$path = trim($path);

if ($path) {
    // clean slashes
    $path = Path::clean($path);
    
    // set text as basename if not an image
    if ($layout == 'link') {
        // set default target
        $attribs['target'] = $data->media_target;

        // set target as download
        if ($data->media_target == 'download') {
            $attribs['download'] = $path;
        }
    }

    // check for valid path after clean
    if (is_file(JPATH_SITE . '/' . $path)) {
        $attribs['src'] = $path;

        LayoutHelper::$defaultBasePath = JPATH_PLUGINS . '/fields/mediajce/layouts';

        $buffer = LayoutHelper::render('plugins.fields.mediajce.' . $layout, $attribs);

        if ($data->media_type == 'embed' && $data->media_caption) {
            
            $figure = array();
            $caption_class = (string) $fieldParams->get('media_caption_class', '');
        
            if ($caption_class) {
                $caption_class = preg_replace('#[^ \w-]#i', '', $caption_class);
                $figure['class'] = $caption_class;
            }

            $figure['caption'] = $data->media_caption;
            $figure['html'] = $buffer;

            $buffer = LayoutHelper::render('plugins.fields.mediajce.', $figure);
        }
    }
}

echo $buffer;