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
}
