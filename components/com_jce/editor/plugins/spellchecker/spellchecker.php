<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

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
    }

    private function getConfig()
    {
        static $config;

        if (empty($config)) {

            $config = array(
                // PSpell settings
                'PSpell.mode' => $this->getParam('spellchecker.pspell_mode', 'PSPELL_FAST'),
                'PSpell.spelling' => $this->getParam('spellchecker.pspell_spelling', ''),
                'PSpell.jargon' => $this->getParam('spellchecker.pspell_jargon', ''),
                'PSpell.encoding' => $this->getParam('spellchecker.pspell_encoding', ''),
                'PSpell.dictionary' => JPATH_BASE . '/' . $this->getParam('spellchecker.pspell_dictionary', ''),
            );
        }

        return $config;
    }

    private function getEngine()
    {
        static $instance;

        if (!is_object($instance)) {
            $classname = '';
            $config = array();

            $engine = $this->getParam('spellchecker.engine', 'browser', 'browser');

            if (($engine === 'pspell' || $engine === 'pspellshell') && function_exists('pspell_new')) {
                $classname = 'PSpell';

                $config = $this->getConfig();
            }

            if ($engine === 'enchantspell' && function_exists('enchant_broker_init')) {
                $classname = 'Enchantspell';
            }

            if (!empty($classname)) {
                $file = __DIR__ . '/classes/' . strtolower($classname) . '.php';

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
        die('{"result":null,"id":null,"error":{"errstr":"' . addslashes($str) . '","errfile":"","errline":null,"errcontext":"","level":"FATAL"}}');
    }
}
