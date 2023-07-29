<?php

/**
 * @copyright     Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die('RESTRICTED');

use Joomla\CMS\Language\Text;

abstract class WFText
{
    public static function _($string, $default = '')
    {
        return Text::_($string);
    }

    public static function sprintf($string)
    {
        return Text::sprintf($string);
    }
}
