<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

abstract class WFToken
{
    public static function getToken()
    {
        if (method_exists('JSession', 'getFormToken')) {
            return JSession::getFormToken();
        } else {
            return JFactory::getSession()->getToken();
        }
    }
    /**
     * Check the received token.
     */
    public static function checkToken($method = 'post')
    {
        if (method_exists('JSession', 'checkToken')) {
            return JSession::checkToken('post') || JSession::checkToken('get');
        }
        
        $token = self::getToken();

        // check POST and GET for token
        return JRequest::getVar($token, JRequest::getVar($token, '', 'GET', 'alnum'), 'POST', 'alnum');
    }
}
