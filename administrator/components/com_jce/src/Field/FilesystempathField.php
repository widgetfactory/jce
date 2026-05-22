<?php
namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Form\Field\TextField;

class FilesystempathField extends TextField
{

    /**
     * The form field type.
     *
     * @var    string
     *
     * @since  2.8
     */
    protected $type = 'Filesystempath';

    /**
     * Method to get the field input markup.
     *
     * @return  string  The field input markup.
     *
     * @since   11.1
     */
    protected function getInput()
    {
        $values = $this->value;
        $path   = '';

        // Step 1: If it's an array, flatten the "first meaningful" item.
        if (is_array($values) && !empty($values)) {
            
            // If it's an associative array already (eg: ['path' => 'images']), use it as-is.
            if (array_key_exists('path', $values)) {
                $values = [$values];
            } else {
                // Otherwise take the first non-empty item (eg: first JSON string in the array)
                $values = reset($values);
            }
        }

        // Step 2: If it's a string, try decode JSON; if not JSON, treat as path string.
        if (is_string($values)) {
            $value = trim(htmlspecialchars_decode($values));

            if ($value !== '') {
                $decoded = json_decode($value, true);

                if (json_last_error() === JSON_ERROR_NONE && $decoded !== null && $decoded !== []) {
                    $values = $decoded;
                } else {
                    // Not valid JSON -> it’s a plain path
                    $values = [['path' => $value]];
                }
            } else {
                $values = [];
            }
        }

        // Step 3: Extract first path
        if (is_array($values) && !empty($values)) {
            // If decoded to a single associative item, normalise to a list.
            if (array_key_exists('path', $values)) {
                $values = [$values];
            }

            $first = reset($values);

            if (is_array($first) && isset($first['path'])) {
                $path = (string) $first['path'];
            }
        }

        $this->value = $path;

        // collect the layout data...
        $layoutData = $this->getLayoutData();

        // ...and reset the value to the processed value
        $layoutData['value'] = htmlspecialchars($this->value, ENT_COMPAT, 'UTF-8');

        return $this->getRenderer($this->layout)->render($layoutData);
    }
}