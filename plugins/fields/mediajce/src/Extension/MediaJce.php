<?php

/**
 * @package     Jce.Plugin
 * @subpackage  Fields.mediajce
 *
 * @copyright   (C) 2017 Open Source Matters, Inc. <https://www.joomla.org>
 * @copyright   (C) 2020 - 2024 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Fields\MediaJce\Extension;

use Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin;
use Joomla\Plugin\Fields\MediaJce\PluginTraits\FormTrait;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Fields Media Plugin
 *
 * @since  2.9.73
 */
final class MediaJce extends FieldsPlugin
{   
    use FormTrait;
}