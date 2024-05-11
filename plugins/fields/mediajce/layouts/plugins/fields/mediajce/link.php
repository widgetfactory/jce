<?php

defined('_JEXEC') or die;

use Joomla\Utilities\ArrayHelper;

$displayData['href'] = $displayData['src'];

unset($displayData['src']);

$attribs = array();

foreach ($displayData as $key => $value) {
    if ($value !== '') {
        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        $attribs[$key] = $value;
    }
};

$text = isset($attribs['title']) ? $attribs['title'] : basename($attribs['href']);

echo '<a ' . ArrayHelper::toString($attribs) . '>' . $text . '</a>';