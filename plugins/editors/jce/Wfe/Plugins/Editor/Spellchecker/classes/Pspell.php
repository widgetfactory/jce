<?php

require_once __DIR__ . '/spellchecker.php';

/**
 * @author Moxiecode
 * @copyright Copyright (c) 2004-2007, Moxiecode Systems AB, All rights reserved
 * @copyright Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license GNU General Public License version 2 or later; see LICENSE.txt
 */
class Pspell extends SpellChecker
{
    /**
     * Spellchecks an array of words.
     *
     * @param string $lang  Language code like sv or en
     * @param array  $words Array of words to spellcheck
     *
     * @return array Array of misspelled words
     */
    public function checkWords($lang, $words)
    {
        $this->validateLang($lang);

        $plink = $this->getPLink($lang);

        $outWords = array();
        foreach ($words as $word) {
            if (!pspell_check($plink, trim($word))) {
                $outWords[] = mb_convert_encoding($word, 'UTF-8', 'ISO-8859-1');
            }
        }

        return $outWords;
    }

    /**
     * Returns suggestions for a specific word.
     *
     * @param string $lang Language code like sv or en
     * @param string $word Specific word to get suggestions for
     *
     * @return array Array of suggestions for the specified word
     */
    public function getSuggestions($lang, $word)
    {
        $this->validateLang($lang);

        $words = pspell_suggest($this->getPLink($lang), $word);

        for ($i = 0; $i < count($words); ++$i) {
            $words[$i] = mb_convert_encoding($words[$i], 'UTF-8', 'ISO-8859-1');
        }

        return $words;
    }

    /**
     * Opens a pspell link for the given language.
     *
     * @param string $lang Language code
     *
     * @return resource|\PSpell\Dictionary
     */
    private function getPLink($lang)
    {
        if (!function_exists('pspell_new')) {
            throw new \RuntimeException('PSpell support not found in PHP installation.');
        }

        $pspell_config = pspell_config_create(
            $lang,
            $this->_config['PSpell.spelling'],
            $this->_config['PSpell.jargon'],
            $this->_config['PSpell.encoding']
        );

        $dictionary = $this->_config['PSpell.dictionary'];

        if (!empty($dictionary)) {
            $dictDir = realpath(dirname($dictionary));
            $realBase = realpath(JPATH_BASE);

            if ($dictDir === false || strpos($dictDir, $realBase) !== 0) {
                throw new \RuntimeException('Invalid PSpell dictionary path.');
            }

            pspell_config_personal($pspell_config, $dictionary);
        }

        $plink = pspell_new_config($pspell_config);

        if (!$plink) {
            throw new \RuntimeException('No PSpell link could be opened.');
        }

        return $plink;
    }
}
