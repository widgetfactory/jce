<?php
class WFLoader
{
    /**
     * Class map: [ 'ClassName' => '/path/to/ClassName.php' ]
     *
     * @var array
     */
    protected static $classMap = [];

    /**
     * Register a class and its file path.
     *
     * @param string $class The class name (non-namespaced or namespaced)
     * @param string $path  The absolute path to the file
     */
    public static function register($class, $path)
    {
        self::$classMap[$class] = $path;
    }

    /**
     * Autoload callback.
     *
     * @param string $class The class name being loaded
     */
    public static function load($class)
    {
        if (isset(self::$classMap[$class]) && file_exists(self::$classMap[$class])) {
            require_once self::$classMap[$class];
        }
    }
}

// Register the autoloader once
spl_autoload_register(['WFLoader', 'load'], true, true);
