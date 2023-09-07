<?php

defined('_JEXEC') or die;

use Joomla\Utilities\ArrayHelper;

$displayData['href'] = $displayData['src'];

unset($displayData['src']);

$text = basename($displayData['href']);

if (isset($displayData['title'])) {
    $text = $displayData['title'];
    unset($displayData['title']);
}

array_walk($displayData, function (&$value, $key) {
    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
});

echo '<a ' . ArrayHelper::toString($displayData) . '>' . htmlspecialchars($text, ENT_QUOTES, 'UTF-8') . '</a>';