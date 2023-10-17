<?php

defined('_JEXEC') or die;

use Joomla\Utilities\ArrayHelper;

$caption    = $displayData['caption'];
$html       = $displayData['html']; 

unset($displayData['caption']);
unset($displayData['html']);

array_walk($displayData, function (&$value, $key) {
    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
});

echo '<figure' . ArrayHelper::toString($displayData) . '>' . $html . '<figcaption>' . htmlentities($caption, ENT_COMPAT, 'UTF-8', true) . '</figcaption></figure>';