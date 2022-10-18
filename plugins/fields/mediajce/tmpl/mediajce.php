<?php

/**
 * @package     Joomla.Plugin
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2019 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('_JEXEC') or die;

use Joomla\CMS\Filesystem\File;
use Joomla\CMS\Filesystem\Path;
use Joomla\Utilities\ArrayHelper;
use Joomla\CMS\Helper\MediaHelper;
use Joomla\CMS\Filter\InputFilter;

if ($field->value == '') {
    return;
}

$data = json_decode($field->value, true);

if (!$data) {
    $data = array(
        'media_src' => $field->value
    );
}

$data = array_merge(array(
    'media_src'         => '',
    'media_text'        => '',
    'media_type'        => (string) $fieldParams->get('mediatype', 'embed'),
    'media_target'      => (string) $fieldParams->get('media_target', ''),
    'media_class'       => (string) $fieldParams->get('media_class', ''),
    'media_caption'     => ''
), $data);

// convert to object
$data = (object) $data;

// convert legacy value
if (isset($data->src)) {
    $data->media_src = $data->src;
}

// clean Joomla 4 media stuff
if ($pos = strpos($data->media_src, '#')) {
    $data->media_src = substr($data->media_src, 0, $pos);
}

$allowable = array(
    'img'       => 'jpg,jpeg,png,gif',
    'audio'     => 'mp3,m4a,mp4a,ogg',
    'video'     => 'mp4,mp4v,mpeg,mov,webm',
    'iframe'    => 'doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv'
);

// get file extension to determine tag
$extension = File::getExt($data->media_src);
// lowercase
$extension = strtolower($extension);

// default tag is an anchor
$tag = 'link';
$element = '<a href="%s"%s>%s</a>';

array_walk($allowable, function ($values, $key) use ($extension, &$tag) {
    if (in_array($extension, explode(',', $values))) {
        $tag = $key;
    }
});

$attribs = array();

if ($data->media_class) {
    $attribs['class'] = htmlentities($data->media_class, ENT_COMPAT, 'UTF-8', true);
}

$text = '';

if ($data->media_text) {
    $text = htmlentities($data->media_text, ENT_COMPAT, 'UTF-8', true);
}

switch ($tag) {
    case 'img':
        $element = '<img src="%s"%s alt="%s" />';

        $attribs['width']    = isset($data->media_width) ? $data->media_width : '';
        $attribs['height']   = isset($data->media_height) ? $data->media_height : '';
        $attribs['loading']  = 'lazy';
        break;
    case 'audio':
        $element = '<audio src="%s"%s></audio>';
        $attribs['controls'] = 'controls';

        if ($text) {
            $attribs['title'] = $text;
        }

        break;
    case 'video':
        $element = '<video src="%s"%s></video>';
        $attribs['controls'] = 'controls';

        $attribs['width']    = $data->media_width || '';
        $attribs['height']     = $data->media_height || '';

        if ($text) {
            $attribs['title'] = $text;
        }

        break;
    case 'iframe':
        $element = '<iframe src="%s"%s></iframe>';

        $attribs['frameborder'] = 0;
        $attribs['width']    = isset($data->media_width) ? $data->media_width : '100%';
        $attribs['height']   = isset($data->media_height) ? $data->media_height : '100%';
        $attribs['loading']  = 'lazy';

        if ($text) {
            $attribs['title'] = $text;
        }

        break;
}

if ($data->media_type == 'embed' && $data->media_caption) {
    $element = '<figure>' . $element . '<figcaption>' . htmlentities($data->media_caption, ENT_COMPAT, 'UTF-8', true) . '</figcaption></figure>';
}

$buffer = '';

// remove some common characters
$path = preg_replace('#[\+\\\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]#', '', $data->media_src);

// trim
$path = trim($path);

// check for valid path after clean
if ($path) {

    // clean path
    $path = Path::clean($path);

    // create full path
    $fullpath = JPATH_SITE . '/' . trim($path, '/');

    // check path is valid
    if (is_file($fullpath)) {
        // set text as basename if not an image
        if (!$text && $data->media_type == "files") {
            $text = basename($path);

            if ($target) {
                if ($target == 'download') {
                    $attribs['download'] = $path;
                } else {
                    $attribs['target'] = $target;
                }
            }
        }

        $buffer .= sprintf(
            $element,
            htmlentities($path, ENT_COMPAT, 'UTF-8', true),
            ArrayHelper::toString($attribs),
            $text
        );
    }
}

echo $buffer;