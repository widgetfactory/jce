<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Colorpicker;

\defined('_JEXEC') or die;

class Plugin extends \Wfe\Editor\Plugin\AbstractPlugin
{
    public function __construct()
    {
        parent::__construct(array('colorpicker' => true));
    }

    public function display()
    {
        parent::display();

        $document = $this->getDocument();

        $document->addScript(array('colorpicker'), 'plugins');
        $document->addStyleSheet(array('colorpicker'), 'plugins');
    }
};
