<?php

namespace Wfe\Registry;

use Wfe\Helper\ArrayHelper;

class Registry implements \JsonSerializable
{
    /**
     * Internal data store.
     *
     * @var array
     */
    protected $data = array();

    /**
     * Path separator.
     *
     * @var string
     */
    public $separator = '.';

    /**
     * Constructor.
     *
     * @param mixed $input Initial data. Should be a JSON string, array, or object.
     */
    public function __construct($input = null)
    {
        $this->data = array();

        if (is_string($input)) {
            $this->loadString($input);
        } elseif (is_array($input) || is_object($input)) {
            $this->bindData($this->data, $input);
        }
    }

    public function loadString($input)
    {
        $input = empty($input) ? '{}' : $input;

        $data = json_decode($input, true);

        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException('Provided string failed to decode.');
        }

        if (!is_array($data)) {
            $data = array();
        }

        $this->bindData($this->data, $data);
    }

    /**
     * Magic method to handle deep clone.
     */
    public function __clone()
    {
        // Force a deep copy to avoid shared nested references.
        $this->data = json_decode(json_encode($this->data), true);
        if (!is_array($this->data)) {
            $this->data = array();
        }
    }

    /**
     * Magic method to return a string representation of the registry.
     *
     * @return string JSON encoded string representation of the data.
     */
    public function __toString()
    {
        return $this->toString();
    }

    /**
     * Serialize data to JSON.
     *
     * @return mixed
     */
    public function jsonSerialize(): mixed
    {
        return $this->data;
    }

    /**
     * Retrieves a value from the registry using a given path.
     *
     * @param string $path
     * @param mixed  $default
     *
     * @return mixed
     */
    public function get($path, $default = null)
    {
        if (empty($path) || !is_string($path)) {
            return $default;
        }

        if (strpos($path, $this->separator) === false) {
            if (array_key_exists($path, $this->data) && $this->data[$path] !== null && $this->data[$path] !== '') {
                return $this->data[$path];
            }

            return $default;
        }

        $nodes = explode($this->separator, trim($path));
        $node  = $this->data;

        foreach ($nodes as $n) {
            if (!is_array($node) || !array_key_exists($n, $node)) {
                return $default;
            }

            $node = $node[$n];
        }

        return ($node !== null) ? $node : $default;
    }

    /**
     * Retrieves a value from the registry using a given path and returns it as an array.
     *
     * @param string $path
     * @param mixed  $default
     *
     * @return array
     */
    public function getArray($path, $default = null)
    {
        $value = $this->get($path, $default);

        if (is_array($value)) {
            return $value;
        }

        if (is_object($value)) {
            return (array) json_decode(json_encode($value), true);
        }

        return array();
    }

    /**
     * Get all properties stored in the Registry.
     *
     * @return array
     */
    public function getAll()
    {
        return $this->toArray();
    }

    /**
     * Sets a value in the registry using a given path.
     *
     * @param string $path
     * @param mixed  $value
     *
     * @return mixed
     */
    public function set($path, $value)
    {
        if (empty($path) || !is_string($path)) {
            return $value;
        }

        $keys = explode($this->separator, $path);
        $data = &$this->data;

        foreach ($keys as $key) {
            if (!is_array($data)) {
                // If something already exists at this node and isn't an array,
                // overwrite it so we can continue nesting.
                $data = array();
            }

            if (!array_key_exists($key, $data) || !is_array($data[$key])) {
                $data[$key] = array();
            }

            $data = &$data[$key];
        }

        $data = $value;

        return $value;
    }

    /**
     * Merge another Registry, JSON string, array or object into this Registry.
     *
     * @param mixed $input
     */
    public function merge($input)
    {
        if ($input instanceof self) {
            $input = $input->toArray();
        } elseif (is_string($input)) {
            $input = json_decode($input, true);
        }

        if (is_object($input) || is_array($input)) {
            $this->bindData($this->data, $input);
            return;
        }

        throw new \InvalidArgumentException('Invalid input for merge.');
    }

    /**
     * Convert the registry data to a JSON string.
     *
     * @return string
     */
    public function toString()
    {
        return json_encode($this->data);
    }

    /**
     * Returns all data as an array.
     *
     * @return array
     */
    public function toArray()
    {
        return $this->data;
    }

    /**
     * Returns all data as an object.
     *
     * @return object
     */
    public function toObject()
    {
        $obj = json_decode($this->toString());
        return $obj ?: new \stdClass();
    }

    /**
     * Bind data to this Registry.
     *
     * Recursively expands associative arrays and stdClass objects into the parent array.
     * Class instances (non-stdClass objects) are stored by reference without conversion,
     * preserving them for retrieval via get(). Numeric arrays and scalar values are stored as-is.
     *
     * @param array $parent
     * @param mixed $data
     * @param bool  $recursive
     * @param bool  $allowNull
     *
     * @return void
     */
    protected function bindData(&$parent, $data, $recursive = true, $allowNull = true)
    {
        if (is_object($data)) {
            $data = get_object_vars($data);
        } else {
            $data = (array) $data;
        }

        foreach ($data as $k => $v) {
            if (!$allowNull && !(($v !== null) && ($v !== ''))) {
                continue;
            }

            $isAssocArray = is_array($v) && ArrayHelper::isAssociative($v);
            $isPlainObject = $v instanceof \stdClass;

            if ($recursive && ($isAssocArray || $isPlainObject)) {
                if (!isset($parent[$k]) || !is_array($parent[$k])) {
                    $parent[$k] = array();
                }

                $this->bindData($parent[$k], $v, $recursive, $allowNull);
                continue;
            }

            $parent[$k] = $v;
        }
    }
}
