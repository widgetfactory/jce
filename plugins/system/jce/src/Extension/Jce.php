<?php

/**
 * @package     JCE
 * @subpackage  System.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\System\Jce\Extension;

\JLoader::registerNamespace('Joomla\\Plugin\\Editors\\Jce', JPATH_PLUGINS . '/editors/jce/src', false, false, 'psr4');
\JLoader::register('WfBrowserHelper', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Plugin\System\Jce\PluginTraits\TemplatesTrait;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Factory;
use Joomla\Event\Event;
use Joomla\CMS\Form\Form;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
final class Jce extends CMSPlugin
{
    use TemplatesTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    protected $booted = false;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return array
     *
     * @since   5.0.0
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onAfterRoute' => 'onAfterRoute',
            'onAfterDispatch' => 'onAfterDispatch',
            'onCustomFieldsPrepareDom' => 'onCustomFieldsPrepareDom'
        ];
    }

    private function getDummyDispatcher()
    {
        $dispatcher = $this->getApplication()->getDispatcher();

        return $dispatcher;
    }

    private function bootEditorPlugins()
    {
        if ($this->booted) {
            return;
        }

        $app = $this->getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $plugins = PluginHelper::getPlugin('jce');

        foreach ($plugins as $plugin) {
            if (!preg_match('/^editor[-_]/', $plugin->name)) {
                continue;
            }

            $path = JPATH_PLUGINS . '/jce/' . $plugin->name;

            // only modern plugins
            if (!is_dir($path . '/src')) {
                continue;
            }

            $plugin = $app->bootPlugin($plugin->name, $plugin->type);
            $plugin->setDispatcher($app->getDispatcher());

            $plugin->registerListeners();
        }

        $this->booted = true;
    }

    public function onAfterDispatch()
    {
        $app = $this->getApplication();

        // only in "site"
        if ($app->getClientId() !== 0) {
            return;
        }

        $document = $app->getDocument();

        // must be an html doctype
        if ($document->getType() !== 'html') {
            return true;
        }

        $this->bootEditorPlugins();

        $event = new Event(
            'onWfPluginBeforeDispatch',
            array(
                'subject' => $this
            )
        );

        $app->getDispatcher()->dispatch('onWfPluginBeforeDispatch', $event);
    }

    /**
     * Transforms the field into a DOM XML element and appends it as a child on the given parent.
     *
     * @param   stdClass    $field   The field.
     * @param   DOMElement  $parent  The field node parent.
     * @param   Form        $form    The form.
     *
     * @return  DOMElement
     *
     * @since   3.7.0
     */
    public function onCustomFieldsPrepareDom($field, \DOMElement $parent, Form $form)
    {
        if ($field->type !== 'mediajce') {
            return;
        }
        
        // check if field media have been loaded
        if ($this->mediaLoaded) {
            return;
        }

        $app = $this->getApplication();

        $document = $app->getDocument();

        // load scripts and styles for core JCE Media field
        HTMLHelper::_('jquery.framework');

        $option = Factory::getApplication()->input->getCmd('option');
        $component = ComponentHelper::getComponent($option);

        $document->addScriptOptions('plg_system_jce', array(
            'context' => (int) $component->id,
        ), true);

         $wa = $document->getWebAssetManager();

        $wa->registerAndUseScript('wf_media', Uri::root(true) . '/media/com_jce/site/js/media.min.js');
        $wa->registerAndUseStyle('wf_media', Uri::root(true) . '/media/com_jce/site/css/media.min.css');

        // update the mediaLoaded flag
        $this->mediaLoaded = true;
    }

    public function onWfBeforeEditorLoad(Event $event): void
    {
        $this->BeforeEditorLoad();
    }

    public function onAfterRoute()
    {
        // JCE Pro will load media
        if (PluginHelper::isEnabled('system', 'jcepro')) {
            $this->mediaLoaded = true;
        }
    }
}
