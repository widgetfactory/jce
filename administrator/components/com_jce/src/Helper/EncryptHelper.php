<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2018-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Helper;

defined('JPATH_SITE') or die();

use Defuse\Crypto\Key;
use Defuse\Crypto\Encoding;
use Defuse\Crypto\Crypto;

/**
 * Implements decryption of legacy encrypted profile params.
 */
class EncryptHelper
{
    /**
     * Gets the configured server key from the key file.
     *
     * @param bool $legacy Return raw bytes for legacy AES decryption
     * @return Key|string|'' Empty string if key file is missing or invalid
     */
    public static function getKey($legacy = false)
    {
        if (!defined('WF_SERVERKEY')) {
            $filename = JPATH_ADMINISTRATOR . '/components/com_jce/serverkey.php';

            if (is_file($filename)) {
                include_once($filename);
            }
        }

        if (defined('WF_SERVERKEY')) {
            if ($legacy) {
                return base64_decode(WF_SERVERKEY);
            }

            try {
                $keyAscii = Encoding::hexToBin(WF_SERVERKEY);
                $key = Key::loadFromAsciiSafeString($keyAscii);
            } catch (\Defuse\Crypto\Exception\BadFormatException $ex) {
                return "";
            }

            return $key;
        }

        return "";
    }

    /**
     * Decrypts legacy-encrypted profile params. Returns plaintext as-is if
     * no recognised encryption marker is present.
     *
     * @param string $encrypted The stored params string
     * @return string Decrypted params, or empty string on decryption failure
     */
    public static function decrypt($encrypted)
    {
        $mode = substr($encrypted, 0, 12);

        // Legacy AES / CTR encrypted content is no longer supported
        if ($mode == '###AES128###' || $mode == '###CTR128###') {
            return "";
        }

        if ($mode == '###DEFUSE###') {
            $key = self::getKey();

            if (empty($key)) {
                return '';
            }

            $decoded = base64_decode(substr($encrypted, 12));

            try {
                $decrypted = Crypto::decrypt($decoded, $key);
            } catch (\Defuse\Crypto\Exception\WrongKeyOrModifiedCiphertextException $ex) {
                return '';
            }

            return rtrim($decrypted, "\0");
        }

        return $encrypted;
    }
}
