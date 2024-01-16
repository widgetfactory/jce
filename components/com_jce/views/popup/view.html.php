<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\View\AbstractView;
use Joomla\CMS\Uri\Uri;

class JceViewPopup extends AbstractView
{
    public function display($tpl = null)
    {
        $app = Factory::getApplication();
        $document = Factory::getDocument();

        $document->addScript(Uri::root(true) . '/media/com_jce/site/js/popup.min.js');
        $document->addStylesheet(Uri::root(true) . '/media/com_jce/site/css/popup.min.css');

        // Get variables
        $img = $app->input->get('img', '', 'STRING');
        $title = $app->input->getWord('title');
        $mode = $app->input->getInt('mode', '0');
        $click = $app->input->getInt('click', '0');
        $print = $app->input->getInt('print', '0');

        $dim = array('', '');

        if (strpos('://', $img) === false) {
            $path = JPATH_SITE . '/' . trim(str_replace(Uri::root(), '', $img), '/');
            if (is_file($path)) {
                $dim = @getimagesize($path);
            }
        }

        $width = $app->input->getInt('w', $app->input->getInt('width', ''));
        $height = $app->input->getInt('h', $app->input->getInt('height', ''));

        if (!$width) {
            $width = $dim[0];
        }

        if (!$height) {
            $height = $dim[1];
        }

        // Cleanup img variable
        $img = preg_replace('/[^a-z0-9\.\/_-]/i', '', $img);

        $title = isset($title) ? str_replace('_', ' ', $title) : basename($img);
        // img src must be passed
        if ($img) {
            $features = array(
                'img' => str_replace(Uri::root(), '', $img),
                'title' => $title,
                'alt' => $title,
                'mode' => $mode,
                'click' => $click,
                'print' => $print,
                'width' => $width,
                'height' => $height,
            );

            $document->addScriptDeclaration('(function(){WfWindowPopup.init(' . $width . ', ' . $height . ', ' . $click . ');})();');

            $this->features = $features;
        } else {
            $app->redirect('index.php');
        }

        parent::display($tpl);
    }
}
