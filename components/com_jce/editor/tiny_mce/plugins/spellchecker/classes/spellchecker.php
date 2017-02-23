<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
require_once WF_EDITOR_LIBRARIES.'/classes/plugin.php';

class WFSpellCheckerPlugin extends WFEditorPlugin
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();

        $engine = $this->getEngine();

        if (!$engine) {
            self::error('No Spellchecker Engine available');
        }

        $request = WFRequest::getInstance();

        // Setup plugin XHR callback functions
        $request->setRequest(array($engine, 'checkWords'));
        $request->setRequest(array($engine, 'getSuggestions'));
        $request->setRequest(array($engine, 'ignoreWord'));
        $request->setRequest(array($engine, 'ignoreWords'));
        $request->setRequest(array($engine, 'learnWord'));

        $this->execute();
    }

    private function getConfig()
    {
        static $config;

        if (empty($config)) {
            $params = $this->getParams();

            $config = array(
                // PSpell settings
                'PSpell.mode' => $params->get('spellchecker.pspell_mode', 'PSPELL_FAST'),
                'PSpell.spelling' => $params->get('spellchecker.pspell_spelling', ''),
                'PSpell.jargon' => $params->get('spellchecker.pspell_jargon', ''),
                'PSpell.encoding' => $params->get('spellchecker.pspell_encoding', ''),
                'PSpell.dictionary' => JPATH_BASE.'/'.$params->get('spellchecker.pspell_dictionary', ''),
            );
        }

        return $config;
    }

    private function getEngine()
    {
        static $instance;

        if (!is_object($instance)) {
            $params = $this->getParams();
            $classname = '';
            $config = array();

            $engine = $params->get('spellchecker.engine', 'browser', 'browser');

            if (($engine === 'pspell' || $engine === 'pspellshell') && function_exists('pspell_new')) {
                $classname = 'PSpell';

                $config = $this->getConfig();
            }

            if ($engine === 'enchantspell' && function_exists('enchant_broker_init')) {
                $classname = 'Enchantspell';
            }

            if (!empty($classname)) {
                $file = dirname(__FILE__).'/'.strtolower($classname).'.php';

                if (is_file($file)) {
                    require_once $file;
                    $instance = new $classname($config);
                }
            }
        }

        return $instance;
    }

    private static function error($str)
    {
        die('{"result":null,"id":null,"error":{"errstr":"'.addslashes($str).'","errfile":"","errline":null,"errcontext":"","level":"FATAL"}}');
    }
}

/**
 * @author Moxiecode
 * @copyright Copyright (c) 2004-2007, Moxiecode Systems AB, All rights reserved
 */
class SpellChecker
{
    public function __construct()
    {
    }

    /**
     * Constructor.
     *
     * @param $config Configuration name/value array
     */
    public function SpellChecker(&$config)
    {
        $this->_config = $config;
    }

    /**
     * Simple loopback function everything that gets in will be send back.
     *
     * @param $args.. Arguments
     *
     * @return {Array} Array of all input arguments
     */
    protected function &loopback(/* args.. */)
    {
        return func_get_args();
    }

    /**
     * Spellchecks an array of words.
     *
     * @param {String} $lang  Language code like sv or en
     * @param {Array}  $words Array of words to spellcheck
     *
     * @return {Array} Array of misspelled words
     */
    public function &checkWords($lang, $words)
    {
        return $words;
    }

    /**
     * Returns suggestions of for a specific word.
     *
     * @param {String} $lang Language code like sv or en
     * @param {String} $word Specific word to get suggestions for
     *
     * @return {Array} Array of suggestions for the specified word
     */
    public function &getSuggestions($lang, $word)
    {
        return array();
    }

    /**
     * Throws an error message back to the user. This will stop all execution.
     *
     * @param {String} $str Message to send back to user
     */
    protected function throwError($str)
    {
        die('{"result":null,"id":null,"error":{"errstr":"'.addslashes($str).'","errfile":"","errline":null,"errcontext":"","level":"FATAL"}}');
    }
}
