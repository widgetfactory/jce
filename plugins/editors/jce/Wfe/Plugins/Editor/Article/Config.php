<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Article;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        //$settings['article_hide_xtd_btns']     = $wf->getParam('article.hide_xtd_btns', 0, 0);
        $settings['article_show_readmore'] = $wf->getParam('article.show_readmore', 1, 1);
        $settings['article_show_pagebreak'] = $wf->getParam('article.show_pagebreak', 1, 1);
    }
}
