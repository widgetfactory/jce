<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Filesystem\Path;
use Joomla\CMS\Object\CMSObject;

final class WFView extends CMSObject
{
    private $path = array();

    public function __construct($config = array())
    {
        if (!array_key_exists('base_path', $config)) {
            $config['base_path'] = WF_EDITOR_LIBRARIES;
        }

        if (!array_key_exists('layout', $config)) {
            $config['layout'] = 'default';
        }

        if (!array_key_exists('name', $config)) {
            $config['name'] = '';
        }

        $this->setProperties($config);

        if (array_key_exists('template_path', $config)) {
            $this->addTemplatePath($config['template_path']);
        } else {
            $this->addTemplatePath($this->get('base_path') . '/views/' . $this->getName() . '/tmpl');
        }
    }

    /**
     * Execute and display a template script.
     *
     * @param string $tpl The name of the template file to parse;
     *                    automatically searches through the template paths
     *
     * @copyright Copyright Copyright (C) 2005 - 2010 Open Source Matters. All rights reserved
     * @license GNU/GPL, see LICENSE.php
     */
    public function display($tpl = null)
    {
        $result = $this->loadTemplate($tpl);

        if ($result instanceof Exception) {
            return $result;
        }

        echo $result;
    }

    public function getName()
    {
        return $this->get('name');
    }

    public function setLayout($layout)
    {
        $this->set('layout', $layout);
    }

    public function getLayout()
    {
        return $this->get('layout');
    }

    public function addTemplatePath($path)
    {
        $this->path[] = $path;
    }

    public function getTemplatePath()
    {
        return $this->path;
    }

    /**
     * Load a template file.
     *
     * @param string $tpl The name of the template source file ...
     *                    automatically searches the template paths and compiles as needed
     *
     * @return string The output of the the template script.
     *
     * @copyright Copyright Copyright (C) 2005 - 2010 Open Source Matters. All rights reserved
     * @license GNU/GPL, see LICENSE.php
     */
    public function loadTemplate($tpl = null)
    {
        // clear prior output
        $output = null;
        $template = null;

        //create the template file name based on the layout
        $file = isset($tpl) ? $this->getLayout() . '_' . $tpl : $this->getLayout();

        // clean the file name
        $file = preg_replace('/[^A-Z0-9_\.-]/i', '', $file);

        if (isset($tpl)) {
            $tpl = preg_replace('/[^A-Z0-9_\.-]/i', '', $tpl);
        }

        $path = $this->getTemplatePath();

        $template = Path::find($path, $file . '.php');

        if ($template != false) {
            // unset so as not to introduce into template scope
            unset($tpl);
            unset($file);

            // never allow a 'this' property
            if (isset($this->this)) {
                unset($this->this);
            }

            // start capturing output into a buffer
            ob_start();
            // include the requested template filename in the local scope
            // (this will execute the view logic).
            include $template;

            // done with the requested template; get the buffer and
            // clear it.
            $output = ob_get_contents();
            ob_end_clean();

            return $output;
        } else {
            throw new InvalidArgumentException('Layout "' . $file . '" not found in Paths ' . implode(', ', $path));
        }
    }
}
