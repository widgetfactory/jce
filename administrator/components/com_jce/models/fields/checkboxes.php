<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Form\Field\ListField;

/**
 * Form Field class for the Joomla Platform.
 * Displays options as a list of checkboxes.
 * Multiselect may be forced to be true.
 *
 * @see    JFormFieldCheckbox
 * @since  1.7.0
 */
class JFormFieldCheckboxes extends ListField
{
    /**
     * The form field type.
     *
     * @var    string
     * @since  1.7.0
     */
    protected $type = 'Checkboxes';

    /**
     * Name of the layout being used to render the field
     *
     * @var    string
     * @since  3.5
     */
    protected $layout = 'form.field.checkboxes';

    /**
     * Flag to tell the field to always be in multiple values mode.
     *
     * @var    boolean
     * @since  1.7.0
     */
    protected $forceMultiple = true;

    /**
     * The comma separated list of checked checkboxes value.
     *
     * @var    mixed
     * @since  3.2
     */
    public $checkedOptions;

    /**
     * Method to get certain otherwise inaccessible properties from the form field object.
     *
     * @param   string  $name  The property name for which to get the value.
     *
     * @return  mixed  The property value or null.
     *
     * @since   3.2
     */
    public function __get($name)
    {
        switch ($name) {
            case 'forceMultiple':
            case 'checkedOptions':
                return $this->$name;
        }

        return parent::__get($name);
    }

    /**
     * Method to set certain otherwise inaccessible properties of the form field object.
     *
     * @param   string  $name   The property name for which to set the value.
     * @param   mixed   $value  The value of the property.
     *
     * @return  void
     *
     * @since   3.2
     */
    public function __set($name, $value)
    {
        switch ($name) {
            case 'checkedOptions':
                $this->checkedOptions = (string) $value;
                break;

            default:
                parent::__set($name, $value);
        }
    }

    /**
     * Method to get the radio button field input markup.
     *
     * @return  string  The field input markup.
     *
     * @since   1.7.0
     */
    protected function getInput()
    {
        if (empty($this->layout)) {
            throw new UnexpectedValueException(sprintf('%s has no layout assigned.', $this->name));
        }

        return $this->getRenderer($this->layout)->render($this->getLayoutData());
    }

    /**
     * Method to attach a JForm object to the field.
     *
     * @param   SimpleXMLElement  $element  The SimpleXMLElement object representing the `<field>` tag for the form field object.
     * @param   mixed             $value    The form field value to validate.
     * @param   string            $group    The field name group control value. This acts as an array container for the field.
     *                                      For example if the field has name="foo" and the group value is set to "bar" then the
     *                                      full field name would end up being "bar[foo]".
     *
     * @return  boolean  True on success.
     *
     * @see     JFormField::setup()
     * @since   3.2
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        $return = parent::setup($element, $value, $group);

        if ($return) {
            $this->checkedOptions = (string) $this->element['checked'];
        }

        return $return;
    }

    /**
     * Method to get the data to be passed to the layout for rendering.
     *
     * @return  array
     *
     * @since   3.5
     */
    protected function getLayoutData()
    {
        $data = parent::getLayoutData();

        // True if the field has 'value' set. In other words, it has been stored, don't use the default values.
        $hasValue = (isset($this->value) && !empty($this->value));

        // If a value has been stored, use it. Otherwise, use the defaults.
        $checkedOptions = $hasValue ? $this->value : $this->checkedOptions;

        $extraData = array(
            'checkedOptions' => is_array($checkedOptions) ? $checkedOptions : explode(',', (string) $checkedOptions),
            'hasValue' => $hasValue,
            'options' => $this->getOptions(),
        );

        return array_merge($data, $extraData);
    }

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
}
