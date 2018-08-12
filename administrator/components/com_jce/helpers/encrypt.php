<?php

/**
 * @copyright Copyright (c)2009-2013 Nicholas K. Dionysopoulos
 * @copyright Copyright (c)2014 Ryan Demmer
 * @license GNU General Public License version 3, or later
 *
 * @since 2.4
 *
 * Modified for JCE by Ryan Demmer
 */
// Protection against direct access
defined('_JEXEC') or die();

require_once dirname(dirname(__FILE__)).'/classes/encrypt.php';

/**
 * Implements encrypted settings handling features.
 */
class WFEncryptHelper
{
    /**
     * PBKDF2 Implementation for deriving keys.
     *
     * @param string $p  Password
     * @param string $s  Salt
     * @param int    $kl Key length
     * @param int    $c  Iteration count
     * @param string $a  Hash algorithm
     *
     * @return string The derived key
     *
     * @see     http://en.wikipedia.org/wiki/PBKDF2
     * @see     http://www.ietf.org/rfc/rfc2898.txt
     *
     * @copyright   Copyright (C) 2005 - 2011 Open Source Matters, Inc. All rights reserved
     */
    protected static function pbkdf2($p, $s, $kl, $c = 10000, $a = 'sha256')
    {
        // simple md5 version
        if (!function_exists('hash')) {
            $seed = $p.$s;

            $md5 = md5($seed);

            for ($i = 0; $i < $c; ++$i) {
                $md5 = md5($md5.md5(rand(0, 2147483647)));
            }

            return substr($md5, 0, $kl);
        }

        // Hash length.
        $hl = strlen(hash($a, null, true));

        // Key blocks to compute.
        $kb = ceil($kl / $hl);

        // Derived key.
        $dk = '';

        // Create the key.
        for ($block = 1; $block <= $kb; ++$block) {
            // Initial hash for this block.
            $ib = $b = hash_hmac($a, $s.pack('N', $block), $p, true);

            // Perform block iterations.
            for ($i = 1; $i < $c; ++$i) {
                $ib ^= ($b = hash_hmac($a, $b, $p, true));
            }

            // Append the iterated block.
            $dk .= $ib;
        }

        // Return derived key of correct length.
        return substr($dk, 0, $kl);
    }

    protected static function generateKey()
    {
        jimport('joomla.crypt.crypt');

        $key = JCrypt::genRandomBytes(32);
        $salt = md5_file(JPATH_SITE.'/configuration.php');

        $key = base64_encode(self::pbkdf2($key, $salt, 32));

        $filecontents = "<?php defined('WF_EDITOR') or die(); define('WF_SERVERKEY', '$key'); ?>";
        $filename = JPATH_COMPONENT_ADMINISTRATOR.'/serverkey.php';

        $result = JFile::write($filename, $filecontents);

        if (!$result) {
            return '';
        } else {
            return base64_decode($key);
        }
    }

    /**
     * Gets the configured server key, automatically loading the server key storage file
     * if required.
     *
     * @return string
     */
    public static function getKey()
    {
        if (defined('WF_SERVERKEY')) {
            return base64_decode(WF_SERVERKEY);
        }

        $filename = dirname(dirname(__FILE__)).'/serverkey.php';

        if (file_exists($filename)) {
            include_once $filename;

            if (defined('WF_SERVERKEY')) {
                return base64_decode(WF_SERVERKEY);
            }
        } else {
            return self::generateKey();
        }
    }

    /**
     * Do the server options allow us to use settings encryption?
     *
     * @return bool
     */
    public static function supportsEncryption()
    {
        // Do we have base64_encode/_decode required for encryption?
        if (!function_exists('base64_encode') || !function_exists('base64_decode')) {
            return false;
        }

        // Pre-requisites met. We can encrypt and decrypt!
        return true;
    }

    /**
     * Gets the preferred encryption mode. Currently, if mcrypt is installed and activated we will
     * use AES128.
     *
     * @return string
     */
    public static function preferredEncryption()
    {
        if (function_exists('mcrypt_module_open')) {
            return 'AES128';
        } else {
            return 'CTR128';
        }
    }

    /**
     * Encrypts the settings using the automatically detected preferred algorithm.
     *
     * @param $settingsINI string The raw settings INI string
     *
     * @return string The encrypted data to store in the database
     */
    public static function encrypt($data, $key = null)
    {
        // Do we really support encryption?
        if (!self::supportsEncryption()) {
            return $data;
        }
        // Does any of the preferred encryption engines exist?
        $encryption = self::preferredEncryption();
        if (empty($encryption)) {
            return $data;
        }
        // Do we have a non-empty key to begin with?
        if (empty($key)) {
            $key = self::getKey();
        }
        if (empty($key)) {
            return $data;
        }

        if ($encryption == 'AES128') {
            $encrypted = WFUtilEncrypt::AESEncryptCBC($data, $key, 128);
            if (empty($encrypted)) {
                $encryption = 'CTR128';
            } else {
                // Note: CBC returns the encrypted data as a binary string and requires Base 64 encoding
                $data = '###AES128###'.base64_encode($encrypted);
            }
        }

        if ($encryption == 'CTR128') {
            $encrypted = WFUtilEncrypt::AESEncryptCtr($data, $key, 128);
            if (empty($encrypted)) {
                $encryption = '';
            } else {
                // Note: CTR returns the encrypted data readily encoded in Base 64
                $data = '###CTR128###'.$encrypted;
            }
        }

        return $data;
    }

    /**
     * Decrypts the encrypted settings and returns the plaintext INI string.
     *
     * @param $encrypted string The encrypted data
     *
     * @return string The decrypted data
     */
    public static function decrypt($encrypted, $key = null)
    {
        if (substr($encrypted, 0, 12) == '###AES128###') {
            $mode = 'AES128';
        } elseif (substr($encrypted, 0, 12) == '###CTR128###') {
            $mode = 'CTR128';
        } else {
            return $encrypted;
        }

        if (empty($key)) {
            $key = self::getKey();
        }

        $encrypted = substr($encrypted, 12);

        switch ($mode) {
            case 'AES128':
                $encrypted = base64_decode($encrypted);
                $decrypted = WFUtilEncrypt::AESDecryptCBC($encrypted, $key, 128);
                break;

            case 'CTR128':
                $decrypted = WFUtilEncrypt::AESDecryptCtr($encrypted, $key, 128);
                break;
        }

        return rtrim($decrypted, "\0");
    }
}
