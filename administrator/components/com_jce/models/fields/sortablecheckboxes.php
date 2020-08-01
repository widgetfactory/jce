<?php

defined('JPATH_PLATFORM') or die;

class JFormFieldSortableCheckboxes extends JFormFieldCheckboxes
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  2.8.16
     */
    protected $type = 'SortableCheckboxes';

    /**
     * Method to attach a JForm object to the field.
     *
     * @param SimpleXMLElement $element The SimpleXMLElement object representing the <field /> tag for the form field object
     * @param mixed            $value   The form field value to validate
     * @param string           $group   The field name group control value. This acts as as an array container for the field.
     *                                  For example if the field has name="foo" and the group value is set to "bar" then the
     *                                  full field name would end up being "bar[foo]"
     *
     * @return bool True on success
     *
     * @since  2.8.16
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        $return = parent::setup($element, $value, $group);

        $this->class = trim($this->class . ' sortable');

        return $return;
    }

    private function getOptionFromValue($value)
    {
        $options = parent::getOptions();

        foreach($options as $option) {
            if ($option->value == $value) {
                return $option;
            }
        }

        return (object) array(
            'value' => $value,
            'text' => $value
        );
    }

    protected function getOptions()
    {
        $options = parent::getOptions();

        $values = is_array($this->value) ? $this->value : explode(',', $this->value);

        if (!empty($values)) {
            $custom = array();

            foreach ($values as $value) {
                $tmp = $this->getOptionFromValue($value);
                $tmp->checked = true;

                $custom[] = $tmp;
            }

            // add default options not checked to the end of the options array
            foreach($options as $option) {
                if (!in_array($option->value, $values)) {
                    $custom[] = $option;
                }
            }

            return $custom;
        }

        return $options;
    }
}
