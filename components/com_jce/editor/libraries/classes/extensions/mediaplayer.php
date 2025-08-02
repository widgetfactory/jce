<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

class WFMediaPlayerExtension extends WFExtension
{
    protected static $instance;

    public function __construct($config = array())
    {
        $default = array(
            'name' => '',
            'title' => '',
            'params' => array(),
        );

        $config = array_merge($default, $config);

        parent::__construct($config);
    }

    /**
     * Returns a reference to a manager object.
     *
     * This method must be invoked as:
     *    <pre>  $manager =MediaManager::getInstance();</pre>
     *
     * @return MediaManager The manager object
     *
     * @since 1.5
     */
    public static function getInstance($name = 'jceplayer')
    {
        if (!isset(self::$instance)) {
            $classname = '';

            if ($name && $name != 'none') {
                $player = parent::loadExtensions('mediaplayer', $name);

                if ($player) {
                    $classname = 'WFMediaPlayerExtension_' . ucfirst($player->name);
                }
            }

            if ($classname && class_exists($classname)) {
                self::$instance = new $classname();
            } else {
                self::$instance = new self();
            }
        }

        return self::$instance;
    }

    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();

        if ($this->isEnabled() && $this->get('name')) {
            $document->addScript(array(
                'mediaplayer/' . $this->get('name') . '/js/' . $this->get('name'),
            ), 'extensions');

            $document->addStyleSheet(array(
                'mediaplayer/' . $this->get('name') . '/css/' . $this->get('name'),
            ), 'extensions');

            $document->addScriptDeclaration('WFExtensions.MediaPlayer.init(' . json_encode($this->getProperties()) . ')');
        }
    }

    public function isEnabled()
    {
        return false;
    }

    public function getName()
    {
        return $this->get('name');
    }

    public function getTitle()
    {
        return $this->get('title');
    }

    public function getParams()
    {
        return $this->params;
    }

    public function getParam($param, $default = '')
    {
        $params = $this->getParams();

        return isset($params[$param]) ? $params[$param] : $default;
    }

    /**
     * @param object $player
     *
     * @return string
     */
    public function loadTemplate($tpl = '')
    {
        $output = '';

        if ($this->isEnabled()) {
            $path = WF_EDITOR_EXTENSIONS . '/mediaplayer/' . $this->get('name');

            $file = 'default.php';

            if ($tpl) {
                $file = 'default_' . $tpl . '.php';
            }

            if (file_exists($path . '/tmpl/' . $file)) {
                ob_start();

                include $path . '/tmpl/' . $file;

                $output .= ob_get_contents();
                ob_end_clean();
            }
        }

        return $output;
    }
}
