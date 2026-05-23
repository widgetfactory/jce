<?php

namespace Joomla\Component\Jce\Administrator\Field;

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

class KeyvalueField extends FormField
{
    /**
     * The form field type.
     *
     * @var    string
     *
     * @since  2.8
     */
    protected $type = 'Keyvalue';

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
            $value = htmlspecialchars_decode($this->value);
            $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

            $values = json_decode($value, true);

            // not valid json
            if (empty($values) || json_last_error() !== JSON_ERROR_NONE) {
                $values = array();

                // If the value is a string with key-value pairs, convert it to an array
                if (strpos($value, ':') !== false && strpos($value, '{') === false) {
                    foreach (explode(',', $value) as $item) {
                        $pair = explode(':', $item);

                        array_walk($pair, function (&$val) {
                            $val = trim($val, chr(0x22) . chr(0x27) . chr(0x38));
                        });

                        $values[] = array(
                            'name' => $pair[0],
                            'value' => $pair[1],
                        );
                    }
                } else {
                    // where the value is a string with no key-value pairs, use only the "name" key
                    $values = array(
                        array(
                            'name' => $value,
                            'value' => '',
                        ),
                    );
                }
            }
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

        $subForm = new Form($this->name, array('control' => $this->formControl));

        $children = (array) $this->element->children();

        // if field has defined children
        if (count($children)) {
            $children = $this->element->children();

            $subForm->load($children, true);
            $subForm->setFields($children);
        } else {
            $label = $this->element['label'];

            $xml = '<form><fields name="' . $this->name . '">';

            $keyName = 'name';
            $keyLabel = 'WF_LABEL_NAME';

            if (isset($this->element['keyName'])) {
                $keyName = $this->element['keyName'];
            }

            if (isset($this->element['keyLabel'])) {
                $keyLabel = htmlspecialchars($this->element['keyLabel'], ENT_QUOTES, 'UTF-8');
            }

            $xml .= '<field name="' . $keyName . '" type="text" label="' . $keyLabel . '" description="" />';

            $valueName = 'value';
            $valueLabel = 'WF_LABEL_VALUE';

            if (isset($this->element['valueName'])) {
                $valueName = $this->element['valueName'];
            }

            if (isset($this->element['valueLabel'])) {
                $valueLabel = htmlspecialchars($this->element['valueLabel'], ENT_QUOTES, 'UTF-8');
            }

            $xml .= '<field name="' . $valueName . '" type="text" label="' . $valueLabel . '" description="" />';

            if ($this->element['boolean']) {
                $xml .= '<field name="boolean" type="checkbox" class="wf-keyvalue-boolean" label="' . Text::_('WF_LABEL_BOOLEAN') . '" description="" />';
            }

            $xml .= '</fields></form>';

            $subForm->load($xml);
        }

        $formXml = $subForm->getXml();

        if (!isset($formXml->config)) {
            $formXml->addChild('config');
        }

        if (!isset($formXml->config->inlinehelp)) {
            $formXml->config->addChild('inlinehelp')->addAttribute('button', 'show');
        }

        $fields = $subForm->getFieldset();

        // And finaly build a main container
        $str = array();

        $sortable = '';

        if (isset($this->element['sortable'])) {
            $sortable = ' data-sortable="' . $this->element['sortable'] . '"';
        }

        $str[] = '<div class="form-field-repeatable"' . $sortable . '>';

        // the default field names for the key-value pairs
        $fieldItem = array('name', 'value');

        foreach ($values as $value) {
            $str[] = '<div class="form-field-repeatable-item wf-keyvalue d-flex">';
            $str[] = '  <div class="form-field-repeatable-item-group well p-4 card">';

            $n = 0;

            foreach ($fields as $field) {
                $tmpField = clone $field;

                $tmpField->element['multiple'] = true;

                $name = (string) $tmpField->element['name'];

                $val = is_array($value) && isset($value[$name]) ? $value[$name] : '';

                // if the original value is a string and does not match the field name, use the default field item name
                if (!isset($value[$name]) && is_string($this->value)) {
                    $key = $fieldItem[$n] ?? '';

                    if ($key) {
                        $val = $value[$key] ?? '';
                    }
                }

                $tmpField->setup($tmpField->element, $val, $this->group);

                // assign value after setup() to prevent multiple-field JSON decoding
                $tmpField->value = htmlspecialchars_decode($val);

                // reset id
                $tmpField->id .= '_' . $n;

                // reset name
                $tmpField->name = $name;

                $str[] = $tmpField->renderField(array('description' => $tmpField->description));

                $n++;
            }

            $str[] = '  </div>';

            $str[] = '  <div class="form-field-repeatable-item-control">';
            $str[] = '      <button class="btn btn-link form-field-repeatable-add" aria-label="' . Text::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus pull-right float-right"></i></button>';
            $str[] = '      <button class="btn btn-link form-field-repeatable-remove" aria-label="' . Text::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash pull-right float-right"></i></button>';
            $str[] = '  </div>';

            $str[] = '</div>';
        }

        if (!empty($this->value)) {
            $this->value = htmlspecialchars(json_encode($values));
        }

        $str[] = '<input type="hidden" name="' . $this->name . '" value="' . $this->value . '" />';

        $str[] = '</div>';

        return implode("", $str);
    }
}
