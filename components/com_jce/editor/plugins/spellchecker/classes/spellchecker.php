<?php
/**
 * @copyright Copyright (c) 2004-2007 Moxiecode Systems AB. All rights reserved.
 * @copyright Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   GNU General Public License version 2 or later; see LICENSE.txt
 */
class SpellChecker
{
    protected $_config = array();

    public function __construct($config = array())
    {
        $this->_config = $config;
    }

    public function checkWords($lang, $words)
    {
        return $words;
    }

    public function getSuggestions($lang, $word)
    {
        return array();
    }

    protected function validateLang($lang)
    {
        if (!preg_match('#^[a-z]{2,3}([_\-][a-zA-Z0-9]{2,8})?$#i', $lang)) {
            throw new \InvalidArgumentException('Invalid language code', 400);
        }
    }
}
