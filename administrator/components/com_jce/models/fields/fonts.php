<?php

defined('JPATH_PLATFORM') or die;

class JFormFieldFonts extends JFormFieldCheckboxes
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'Fonts';

    /**
     * Name of the layout being used to render the field
     *
     * @var    string
     * @since  3.5
     */
    protected $layout = 'form.field.fonts';

    /**
     * Flag to tell the field to always be in multiple values mode.
     *
     * @var    boolean
     * @since  11.1
     */
    protected $forceMultiple = false;

    private static $fonts = array(
        'Andale Mono' => 'andale mono,times',
        'Arial' => 'arial,helvetica,sans-serif',
        'Arial Black' => 'arial black,avant garde',
        'Book Antiqua' => 'book antiqua,palatino',
        'Comic Sans MS' => 'comic sans ms,sans-serif',
        'Courier New' => 'courier new,courier',
        'Georgia' => 'georgia,palatino',
        'Helvetica' => 'helvetica',
        'Impact' => 'impact,chicago',
        'Symbol' => 'symbol',
        'Tahoma' => 'tahoma,arial,helvetica,sans-serif',
        'Terminal' => 'terminal,monaco',
        'Times New Roman' => 'times new roman,times',
        'Trebuchet MS' => 'trebuchet ms,geneva',
        'Verdana' => 'verdana,geneva',
        'Webdings' => 'webdings',
        'Wingdings' => 'wingdings,zapf dingbats',
    );

    /**
     * Allow to override renderer include paths in child fields
     *
     * @return  array
     *
     * @since   3.5
     */
    protected function getLayoutPaths()
    {
        return array(JPATH_ADMINISTRATOR . '/components/com_jce/layouts', JPATH_SITE . '/layouts');
    }

    protected function getOptions()
    {
        $fieldname = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $this->fieldname);
        $options = array();

        if (is_string($this->value)) {
            $this->value = json_decode(htmlspecialchars_decode($this->value), true);
        }

        // cast to array
        $this->value = (array) $this->value;

        $fonts = array();

        // map associative array to array of key value pairs
        foreach ($this->value as $key => $value) {
            if (is_numeric($key) && is_array($value)) {
                $fonts[] = $value;
            } else {
                $fonts[] = array($key => $value);
            }
        }
        // array of font names to exclude from default list
        $exclude = array();
        // array of custom font key/value pairs
        $custom = array();

        foreach ($fonts as $font) {
            list($text) = array_keys($font);
            list($value) = array_values($font);

            // add to $exclude array
            $exclude[] = $text;
            
            $value = htmlspecialchars_decode($value, ENT_QUOTES);

            $isCustom = !in_array($value, array_values(self::$fonts));

            $item = array(
                'value' => $value,
                'text' => JText::alt($text, $fieldname),
                'checked' => true,
                'custom' => $isCustom,
            );

            $item = (object) $item;

            if ($isCustom) {
                $custom[] = $item;
            } else {
                $options[] = $item;
            }
        }

        // assign empty (unchecked) options for unused fonts
        foreach (self::$fonts as $text => $value) {

            if (in_array($text, $exclude)) {
                continue;
            }

            $tmp = array(
                'value' => $value,
                'text' => JText::alt($text, $fieldname),
                'checked' => false,
                'custom' => false,
            );

            $options[] = (object) $tmp;
        }

        return array_merge($options, $custom);
    }
}
