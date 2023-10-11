<?php

defined('_JEXEC') or die;

use Joomla\Utilities\ArrayHelper;

array_walk($displayData, function (&$value, $key) {
    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
});

echo '<iframe ' . ArrayHelper::toString($displayData) . '></iframe>';