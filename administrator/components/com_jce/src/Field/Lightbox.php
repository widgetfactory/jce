<?php
namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Form\Field\ListField;
use Joomla\CMS\Language\Text;

use Joomla\Component\Jce\Administrator\Helper\PluginsHelper as JcePluginsHelper;

class LightboxField extends ListField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'Lightbox';

    /**
     * Method to get a list of options for a list input.
     *
     * @return array An array of JHtml options
     *
     * @since   11.4
     */
    protected function getOptions()
    {
        $plugins = JcePluginsHelper::getAdapterPlugins('lightbox');

        $options = array();

        foreach ($plugins as $item) {
            $option = new \StdClass;

            $option->text = Text::_($item->title, true);
            $option->disable = '';
            $option->value = $item->name;

            $options[] = $option;
        }

        // Merge any additional options in the XML definition.
        return array_merge(parent::getOptions(), $options);
    }
}
