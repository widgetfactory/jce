<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Document;

\defined('_JEXEC') or die;

use Wfe\Registry\ConfigurationTrait;
use Wfe\Container\ContainerTrait;

final class View
{
    use ConfigurationTrait;
    use ContainerTrait;
    use TemplateLoaderTrait;

    private $properties = array();

    public function __construct($config = array())
    {
        if (!array_key_exists('base_path', $config)) {
            $config['base_path'] = WF_EDITOR;
        }

        if (!array_key_exists('layout', $config)) {
            $config['layout'] = 'default';
        }

        if (!array_key_exists('name', $config)) {
            $config['name'] = '';
        }

        $this->setConfiguration($config);

        if (array_key_exists('template_path', $config)) {
            $this->addTemplatePath($config['template_path']);
        } else {
            $this->addTemplatePath($this->getConfig('base_path') . '/views/' . $this->getName() . '/tmpl');
        }
    }

    public function set($key, $value)
    {
        $this->properties[$key] = $value;
    }

    public function get($key, $default = null)
    {
        return isset($this->properties[$key]) ? $this->properties[$key] : $default;
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
        echo $this->loadTemplate($tpl);
    }

    public function getName()
    {
        return $this->getConfig('name');
    }

    public function setLayout($layout)
    {
        $this->setConfig('layout', $layout);
    }

    public function getLayout()
    {
        return $this->getConfig('layout');
    }

    /**
     * Load a template file.
     *
     * @param string $tpl The name of the template source file;
     *                    automatically searches the template paths
     *
     * @return string The output of the template script.
     *
     * @copyright Copyright Copyright (C) 2005 - 2010 Open Source Matters. All rights reserved
     * @license GNU/GPL, see LICENSE.php
     */
    public function loadTemplate($tpl = null)
    {
        $file = isset($tpl) ? $this->getLayout() . '_' . $tpl : $this->getLayout();
        $file = preg_replace('/[^A-Z0-9_\.-]/i', '', $file);

        return $this->renderTemplate($file);
    }
}
