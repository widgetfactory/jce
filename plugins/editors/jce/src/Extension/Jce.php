<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Editors\Jce\Extension;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Plugin\Editors\Jce\PluginTraits\DisplayTrait;
use Joomla\Plugin\Editors\Jce\PluginTraits\XTDButtonsTrait;
use Joomla\CMS\Event\Editor\EditorSetupEvent;
use Joomla\CMS\Uri\Uri;

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
    use DisplayTrait;
    use XTDButtonsTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

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
            'onEditorSetup' => 'onEditorSetup'
        ];
    }

    /**
     * Register Editor instance
     *
     * @param EditorSetupEvent $event
     *
     * @return void
     *
     * @since   5.0.0
     */
    public function onEditorSetup(EditorSetupEvent $event)
    {
        $this->getApplication()->getDocument()->addScript(Uri::root(true) . '/media/com_jce/editor/js/editor.module.js', [], ['type' => 'module']);
    }
}
