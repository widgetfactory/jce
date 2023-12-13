<?php

defined('_JEXEC') or die;

use Joomla\Utilities\ArrayHelper;

unset ($displayData['src']);

array_walk($displayData, function (&$value, $key) {
    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
});

echo '<object ' . ArrayHelper::toString($displayData) . '></object>';