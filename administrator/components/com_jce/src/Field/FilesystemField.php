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

        return $this->renderInstance($this->name, 'plg_jce_' . $this->fieldname, $value);
    }

    /**
     * Render a single filesystem selector together with each installed adapter's own
     * configuration sub-form. Shared by the single filesystem field and the repeatable
     * FilesystemsField so both present an identical per-adapter UI.
     *
     * @param   string  $control   Base control name for this instance,
     *                              eg jform[params][filesystem] or ...[filesystems][0].
     * @param   string  $formName  Unique form name prefix for the per-adapter config forms
     *                              (must differ per instance to avoid form cache collisions).
     * @param   array   $value     Instance value: array('name' => <plugin>, <plugin> => array(...)).
     *
     * @return  string  The rendered HTML.
     */
    protected function renderInstance($control, $formName, $value)
    {
        $selected = isset($value['name']) && $value['name'] !== '' ? $value['name'] : $this->default;

        $plugins = $this->getPlugins();
        $options = $this->getOptions();

        $html = '';
        $html .= '<div class="controls-row">';

        $html .= '<div class="control-group">';
        $html .= HTMLHelper::_('select.genericlist', $options, $control . '[name]', 'data-toggle="filesystem-options" class="custom-select"', 'value', 'text', $selected);
        $html .= '</div>';

        $html .= '<div class="filesystem-options clearfix">';

        foreach ($plugins as $plugin) {
            if (!$plugin->manifest) {
                continue;
            }

            $form = Factory::getContainer()->get(FormFactoryInterface::class)->createForm($formName . '_' . $plugin->name, [
                'control' => $control . '[' . $plugin->name . ']',
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
