<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Language;

\defined('_JEXEC') or die;

abstract class Text
{
    public static function _($string, $default = '')
    {
        return \Joomla\CMS\Language\Text::_($string);
    }

    public static function sprintf($string)
    {
        return \Joomla\CMS\Language\Text::sprintf($string);
    }
}
