<?php
namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Form\Field\ListField;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Factory;
use Joomla\CMS\Form\FormFactoryInterface;

class FilesystemField extends ListField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'Filesystem';

    /**
     * Method to get the field input markup.
     *
     * @return string The field input markup
     *
     * @since   11.1
     */
    protected function getInput()
    {
        $value = $this->value;

        // decode json string
        if (!empty($value) && is_string($value)) {
            $value = json_decode($value, true);
        }

        // default
        if (empty($value)) {
            $value = array('name' => $this->default);
        } else {
            if (!isset($value['name'])) {
                $value['name'] = $this->default;
            }
        }

        $plugins = $this->getPlugins();
        $options = $this->getOptions();

        $html = '';
        $html .= '<div class="controls-row">';

        $html .= '<div class="control-group">';
        $html .= HTMLHelper::_('select.genericlist', $options, $this->name . '[name]', 'data-toggle="filesystem-options" class="custom-select"', 'value', 'text', $value['name']);
        $html .= '</div>';

        $html .= '<div class="filesystem-options clearfix">';

        foreach ($plugins as $plugin) {
            if (!$plugin->manifest) {
                continue;
            }
        
            $form = Factory::getContainer()->get(FormFactoryInterface::class)->createForm('plg_jce_' . $this->name . '_' . $plugin->name, [
                'control' => $this->name . '[' . $plugin->name . ']',
            ]);

            if ($form) {
                if (!$form->loadFile($plugin->manifest, true, '//extension')) {
                    continue;
                }

                $formXml = $form->getXml();

                if (!isset($formXml->config)) {
                    $formXml->addChild('config');
                }

                if (!isset($formXml->config->inlinehelp)) {
                    $formXml->config->addChild('inlinehelp')->addAttribute('button', 'show');
                }

                // get the data for this form, if set
                $data = isset($value[$plugin->name]) ? $value[$plugin->name] : array();

                // bind data to form
                $form->bind($data);

                $html .= '<div class="p-3 card bg-light" data-toggle-target="filesystem-options-' . $plugin->name . '">';

                $fields = $form->getFieldset('filesystem.' . $plugin->name);

                foreach ($fields as $field) {
                    $html .= $field->renderField(array('description' => $field->description));
                }

                $html .= '</div>';
            }
        }

        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Method to get the field options.
     *
     * @return array The field option objects
     *
     * @since   11.1
     */
    protected function getPlugins()
    {
        static $plugins;

        if (!isset($plugins)) {
            $plugins = \Wfe\Helper\AdapterHelper::getPlugins('filesystem');
        }

        return $plugins;
    }

    /**
     * Method to get the field options.
     *
     * @return array The field option objects
     *
     * @since   11.1
     */
    protected function getOptions()
    {
        $fieldname = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $this->fieldname);

        $options = parent::getOptions();

        $plugins = $this->getPlugins();

        foreach ($plugins as $plugin) {
            $value = (string) $plugin->name;
            $text = (string) $plugin->title;

            $tmp = array(
                'value' => $value,
                'text' => Text::alt($text, $fieldname),
                'disable' => false,
                'class' => '',
                'selected' => false,
            );

            // Add the option object to the result set.
            $options[] = (object) $tmp;
        }

        reset($options);

        return $options;
    }
}
