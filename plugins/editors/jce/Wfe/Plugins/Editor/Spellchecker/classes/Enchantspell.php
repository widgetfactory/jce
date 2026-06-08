<?php

/**
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

require_once __DIR__ . '/spellchecker.php';

class Enchantspell extends SpellChecker
{
    /**
     * Spellchecks an array of words.
     *
     * @param string $lang  Language code (like en_US or de_DE)
     * @param array  $words Array of words to check
     *
     * @return array Array of misspelled words
     */
    public function checkWords($lang, $words)
    {
        $this->validateLang($lang);

        $r = enchant_broker_init();

        if (!enchant_broker_dict_exists($r, $lang)) {
            enchant_broker_free($r);
            throw new \RuntimeException('Language not installed');
        }

        $d = enchant_broker_request_dict($r, $lang);

        $returnData = array();
        foreach ($words as $value) {
            if (!enchant_dict_check($d, $value)) {
                $returnData[] = trim($value);
            }
        }

        enchant_broker_free_dict($d);
        enchant_broker_free($r);

        return $returnData;
    }

    /**
     * Returns suggestions for a specific word.
     *
     * @param string $lang Language code (like en_US or de_DE)
     * @param string $word Specific word to get suggestions for
     *
     * @return array Array of suggestions for the specified word
     */
    public function getSuggestions($lang, $word)
    {
        $this->validateLang($lang);

        $r = enchant_broker_init();

        if (!enchant_broker_dict_exists($r, $lang)) {
            enchant_broker_free($r);
            throw new \RuntimeException('Language not installed');
        }

        $d = enchant_broker_request_dict($r, $lang);
        $suggs = enchant_dict_suggest($d, $word);

        enchant_broker_free_dict($d);
        enchant_broker_free($r);

        return $suggs;
    }
}
