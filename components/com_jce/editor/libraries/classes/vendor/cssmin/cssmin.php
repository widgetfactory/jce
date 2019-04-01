<?php

require __DIR__ . '/src/Colors.php';
require __DIR__ . '/src/Command.php';
require __DIR__ . '/src/Utils.php';
require __DIR__ . '/src/Minifier.php';

abstract class CssMin {
    public static function minify($text)
    {
        $compressor = new tubalmartin\CssMin\Minifier();

        return $compressor->run($text);
    }
}