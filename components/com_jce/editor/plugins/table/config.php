<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFTablePluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $width = $wf->getParam('table.width');
        $height = $wf->getParam('table.height');

        if ($width && preg_match('#^[0-9\.]$#', $width)) {
            $width .= 'px';
        }

        if ($height && preg_match('#^[0-9\.]$#', $height)) {
            $height .= 'px';
        }

        $settings['table_default_width'] = $width;
        $settings['table_default_height'] = $height;
        $settings['table_default_border'] = $wf->getParam('table.border', 0, 0);
        $settings['table_default_align'] = $wf->getParam('table.align', '', '');
        $settings['table_default_cellpadding'] = $wf->getParam('table.cellpadding', 0, 0);
        $settings['table_default_cellspacing'] = $wf->getParam('table.cellspacing', 0, 0);
        $settings['table_default_rows'] = $wf->getParam('table.rows', 2, 2);
        $settings['table_default_cols'] = $wf->getParam('table.cols', 2, 2);
        $settings['table_cell_limit'] = $wf->getParam('table.cell_limit', 0, 0);
        $settings['table_row_limit'] = $wf->getParam('table.row_limit', 0, 0);
        $settings['table_col_limit'] = $wf->getParam('table.col_limit', 0, 0);
        $settings['table_pad_empty_cells'] = $wf->getParam('table.pad_empty_cells', 1, 1);

        $settings['table_classes'] = $wf->getParam('table.classes', '', '');

        $settings['table_buttons'] = $wf->getParam('table.show_buttons', 1, 1);
    }
}
