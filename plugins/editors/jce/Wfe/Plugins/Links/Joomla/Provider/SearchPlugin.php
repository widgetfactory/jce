<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Links\Joomla\Provider;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;

/**
 * Search-only provider wrapping a legacy Joomla "search" group plugin.
 */
class SearchPlugin extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    protected $plugin;

    public function __construct($container, $plugin)
    {
        parent::__construct($container);

        $this->plugin = $plugin;
    }

    public function getSearchAreas(): array
    {
        if (!method_exists($this->plugin, 'onContentSearchAreas')) {
            return [];
        }

        return (array) $this->plugin->onContentSearchAreas();
    }

    /**
     * Search using the plugin's onContentSearch method.
     *
     * @param \Joomla\Registry\Registry $options
     */
    public function doSearch($options = null): array
    {
        if (empty($options) || !method_exists($this->plugin, 'onContentSearch')) {
            return [];
        }

        try {
            $rows = (array) $this->plugin->onContentSearch(
                $options->get('text', ''),
                $options->get('phrase', 'all'),
                $options->get('ordering', 'newest'),
                $options->get('areas', null)
            );
        } catch (\Throwable $e) {
            return [];
        }

        $base = Uri::base(true);

        foreach ($rows as $row) {
            if (!is_object($row) || empty($row->href)) {
                continue;
            }

            $href = $row->href;

            // remove base url
            if ($base && strpos($href, $base) === 0) {
                $href = ltrim(substr($href, strlen($base)), '/');
            }

            $row->href = $this->routeUrl($href);

            if (!isset($row->text)) {
                $row->text = '';
            }
        }

        return $rows;
    }
}
