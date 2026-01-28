<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

/**
 * Minimal device detection: phone / tablet / desktop
 * - Uses UA heuristics only (optionally you can pass Client Hints headers)
 * - Not meant for security decisions; only UI/UX branching
 */
final class WFDeviceDetect
{
    /** @var string */
    private $ua;

    /** @var array<string, string> */
    private $headers;

    public function __construct($userAgent = null, $headers = null)
    {
        $this->ua = \is_string($userAgent) ? $userAgent : (isset($_SERVER['HTTP_USER_AGENT']) ? (string) $_SERVER['HTTP_USER_AGENT'] : '');
        $this->headers = \is_array($headers) ? $headers : $this->readHeaders();
    }

    public function isPhone()
    {
        return $this->deviceType() === 'phone';
    }

    public function isTablet()
    {
        return $this->deviceType() === 'tablet';
    }

    public function isMobile()
    {
        $t = $this->deviceType();
        return ($t === 'phone' || $t === 'tablet');
    }

    /**
     * @return string 'phone'|'tablet'|'desktop'
     */
    public function deviceType()
    {
        $ua = $this->ua;

        // 1) Client hint: Sec-CH-UA-Mobile: ?1 / ?0 (Chromium)
        // This indicates "mobile", but not "tablet". Still useful as a signal.
        $chMobile = $this->header('sec-ch-ua-mobile');

        if ($chMobile !== '') {
            // If it's explicitly not mobile, likely desktop.
            if (strpos($chMobile, '?0') !== false) {
                return 'desktop';
            }
            // If mobile, we still need to decide phone vs tablet via UA heuristics.
        }

        // 2) Tablets first (avoid misclassifying as phone)
        if ($this->isIPad($ua)) {
            return 'tablet';
        }

        if ($this->isAndroidTablet($ua)) {
            return 'tablet';
        }

        // Some common tablet tokens
        if ($this->match($ua, '(tablet|kindle|silk|playbook|nexus\s(7|9|10)|sm-t\d+)')) {
            return 'tablet';
        }

        // 3) Phones
        if ($this->match($ua, '(mobi|iphone|ipod|windows\sphone|blackberry|bb10)')) {
            return 'phone';
        }

        if ($this->isAndroidPhone($ua)) {
            return 'phone';
        }

        // 4) Default
        return 'desktop';
    }

    private function isIPad($ua)
    {
        // Classic iPad
        if (stripos($ua, 'iPad') !== false) {
            return true;
        }

        // iPadOS 13+: often reports as Macintosh; include "Mobile" when in mobile mode
        // Common heuristic: Macintosh + Mobile + Safari => iPad
        if (stripos($ua, 'Macintosh') !== false && stripos($ua, 'Mobile') !== false) {
            return true;
        }

        return false;
    }

    private function isAndroidTablet($ua)
    {
        // Android tablet typically has "Android" but NOT "Mobile"
        return (stripos($ua, 'Android') !== false && stripos($ua, 'Mobile') === false);
    }

    private function isAndroidPhone($ua)
    {
        // Android phone typically has Android + Mobile
        return (stripos($ua, 'Android') !== false && stripos($ua, 'Mobile') !== false);
    }

    private function match($ua, $pattern)
    {
        return (bool) preg_match('#' . $pattern . '#i', $ua);
    }

    private function header($name)
    {
        $key = strtolower($name);
        return isset($this->headers[$key]) ? $this->headers[$key] : '';
    }

    private function readHeaders()
    {
        $out = array();

        foreach ($_SERVER as $k => $v) {
            if (!\is_string($v)) {
                continue;
            }

            // Convert HTTP_FOO_BAR to foo-bar
            if (strpos($k, 'HTTP_') === 0) {
                $name = strtolower(str_replace('_', '-', substr($k, 5)));
                $out[$name] = $v;
            }
        }

        // Some servers expose these differently
        if (isset($_SERVER['CONTENT_TYPE']) && \is_string($_SERVER['CONTENT_TYPE'])) {
            $out['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        return $out;
    }
}