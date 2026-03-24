<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Charmap;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        $append = $wf->getParam('charmap.charmap_append', array());

        if (!empty($append)) {
            $values = array();

            foreach ($append as $item) {
                $item = (object) $item;

                // invalid values
                if (empty($item->name) || empty($item->value)) {
                    continue;
                }

                $item->name = html_entity_decode($item->name);
                $values[$item->name] = $item->value;
            }

            $settings['charmap_append'] = $values;
        }
    }
}
