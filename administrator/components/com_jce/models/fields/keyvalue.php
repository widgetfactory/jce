<?php

defined('JPATH_PLATFORM') or die;

class JFormFieldKeyValue extends JFormField
{

    /**
     * The form field type.
     *
     * @var    string
     *
     * @since  2.8
     */
    protected $type = 'KeyValue';

    /**
     * Method to attach a JForm object to the field.
     *
     * @param   SimpleXMLElement  $element  The SimpleXMLElement object representing the <field /> tag for the form field object.
     * @param   mixed             $value    The form field value to validate.
     * @param   string            $group    The field name group control value. This acts as as an array container for the field.
     *                                      For example if the field has name="foo" and the group value is set to "bar" then the
     *                                      full field name would end up being "bar[foo]".
     *
     * @return  boolean  True on success.
     *
     * @since   2.8
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        $return = parent::setup($element, $value, $group);

        return $return;
    }

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

        if (is_string($values) && !empty($values)) {
            $values = json_decode(htmlspecialchars_decode($this->value), true);
        }

        // default
        if (empty($values)) {
            $values = array(
                array(
                    'name' => '',
                    'value' => '',
                ),
            );
        }

        $subForm = new JForm($this->name, array('control' => $this->formControl));
        $children = $this->element->children();

        $subForm->load($children);
        $subForm->setFields($children);

        $fields = $subForm->getFieldset();

        // And finaly build a main container
        $str = array();

        foreach ($values as $value) {
            $str[] = '<div class="form-field-repeatable-item wf-keyvalue">';
            $str[] = '  <div class="form-field-repeatable-item-group well well-small p-4 bg-light">';

            $n = 0;

            foreach ($fields as $field) {
                $field->element['multiple'] = true;

                $name = (string) $field->element['name'];

                $val = is_array($value) && isset($value[$name]) ? $value[$name] : '';
 
                // escape value
                $field->value = htmlspecialchars_decode($val);

                $field->setup($field->element, $field->value, $this->group);

                // reset id
                $field->id .= '_' . $n;

                // reset name
                $field->name = $name;

                $str[] = $field->renderField(array('description' => $field->description));
                
                $n++;
            }

            $str[] = '  </div>';

            $str[] = '  <div class="form-field-repeatable-item-control">';
            $str[] = '      <button class="btn btn-link form-field-repeatable-add" aria-label="' . JText::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus pull-right float-right"></i></button>';
            $str[] = '      <button class="btn btn-link form-field-repeatable-remove" aria-label="' . JText::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash pull-right float-right"></i></button>';
            $str[] = '  </div>';

            $str[] = '</div>';
        }

        if (!empty($this->value)) {
            $this->value = htmlspecialchars(json_encode($values));
        }

        $str[] = '<input type="hidden" name="' . $this->name . '" value="' . $this->value . '" />';

        return implode("", $str);
    }
}