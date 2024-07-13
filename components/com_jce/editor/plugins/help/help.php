<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filesystem\File;
use Joomla\CMS\Filesystem\Path;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;

class WFHelpPlugin extends WFEditorPlugin
{
    protected $name = 'help';

    public function __construct($config = array())
    {
        parent::__construct($config);
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $app = Factory::getApplication();

        $section = $app->input->getWord('section');
        $category = $app->input->getWord('category');
        $article = $app->input->getWord('article');
        $language = $app->input->getWord('lang');

        $params = ComponentHelper::getParams('com_jce');

        $url = $params->get('help_url', 'https://www.joomlacontenteditor.net');
        $method = $params->get('help_method', 'reference');
        $pattern = $params->get('help_pattern', '/$1/$2/$3');

        // trim url of trailing slash
        $url = trim($url, '/');

        switch ($method) {
            default:
            case 'reference':
                $url .= '/index.php?option=com_content&view=article&tmpl=component&print=1&mode=inline&task=findkey&lang=' . $language . '&keyref=';
                break;
            case 'xml':
                break;
            case 'sef':
                break;
        }

        $key = array();

        if ($section) {
            $key[] = $section;
            if ($category) {
                $key[] = $category;
                if ($article) {
                    $key[] = $article;
                }
            }
        }

        $options = array(
            'url' => $url,
            'key' => $key,
            'pattern' => $method === "sef" ? $pattern : '',
        );

        $tabs = WFTabs::getInstance(array(
            'base_path' => WF_EDITOR_PLUGIN,
        ));

        // Add tabs
        $tabs->addTab('help', 1, array('plugin' => $this));

        $document = WFDocument::getInstance();

        if ($document->get('standalone') == 1) {
            $document->addScript(array('window.min'));
        }

        $document->addScript(array('help.min'), 'plugins');
        $document->addStyleSheet(array('help.min'), 'plugins');

        $document->addScriptDeclaration('jQuery(document).ready(function($){Wf.Help.init(' . json_encode($options) . ');});');
    }

    public function getLanguage()
    {
        $language = Factory::getLanguage();
        $tag = $language->getTag();

        return substr($tag, 0, strpos($tag, '-'));
    }

    public function getTopics($file)
    {
        $result = '';

        if (file_exists($file)) {
            // load xml
            $xml = simplexml_load_file($file);

            if ($xml) {
                foreach ($xml->help->children() as $topic) {
                    $subtopics = $topic->subtopic;
                    $class = count($subtopics) ? 'subtopics uk-parent' : '';

                    $key = (string) $topic->attributes()->key;
                    $title = (string) $topic->attributes()->title;
                    $file = (string) $topic->attributes()->file;

                    // if file attribute load file
                    if ($file) {
                        $result .= $this->getTopics(WF_EDITOR . '/' . $file);
                    } else {
                        $result .= '<li id="' . $key . '" class="' . $class . '"><a href="#"><span class="uk-icon uk-icon-copy uk-margin-small-right"></span>&nbsp;' . trim(Text::_($title)) . '</a>';
                    }

                    if (count($subtopics)) {
                        $result .= '<ul class="uk-nav uk-nav-side uk-list-space hidden">';
                        foreach ($subtopics as $subtopic) {
                            $sub_subtopics = $subtopic->subtopic;

                            // if a file is set load it as sub-subtopics
                            if ($file = (string) $subtopic->attributes()->file) {
                                $result .= '<li class="subtopics uk-parent"><a href="#"><span class="uk-icon uk-icon-file uk-margin-small-right"></span>&nbsp;' . trim(Text::_((string) $subtopic->attributes()->title)) . '</a>';
                                $result .= '<ul class="uk-nav uk-nav-side uk-list-space hidden">';
                                $result .= $this->getTopics(WF_EDITOR . '/' . $file);
                                $result .= '</ul>';
                                $result .= '</li>';
                            } else {
                                $id = $subtopic->attributes()->key ? ' id="' . (string) $subtopic->attributes()->key . '"' : '';

                                $class = count($sub_subtopics) ? ' class="subtopics uk-parent"' : '';
                                $icon = count($sub_subtopics) ? 'uk-icon-copy' : 'uk-icon-file';
                                $result .= '<li' . $class . $id . '><a href="#"><span class="uk-icon ' . $icon . ' uk-margin-small-right"></span>&nbsp;' . trim(Text::_((string) $subtopic->attributes()->title)) . '</a>';

                                if (count($sub_subtopics)) {
                                    $result .= '<ul class="uk-nav uk-nav-side hidden">';
                                    foreach ($sub_subtopics as $sub_subtopic) {
                                        $result .= '<li id="' . (string) $sub_subtopic->attributes()->key . '"><a href="#"><span class="uk-icon uk-icon-file uk-margin-small-right"></span>&nbsp;' . trim(Text::_((string) $sub_subtopic->attributes()->title)) . '</a></li>';
                                    }
                                    $result .= '</ul>';
                                }

                                $result .= '</li>';
                            }
                        }
                        $result .= '</ul>';
                    }
                }
            }
        }

        return $result;
    }

    /**
     * Returns a formatted list of help topics.
     *
     * @return string
     *
     * @since 1.5
     */
    public function renderTopics()
    {
        $app = Factory::getApplication();

        $section = $app->input->getWord('section', 'admin');
        $category = $app->input->getWord('category', 'cpanel');

        $document = Factory::getDocument();
        $language = Factory::getLanguage();

        $language->load('com_jce', JPATH_SITE);
        $language->load('com_jce_pro', JPATH_SITE);

        $document->setTitle(Text::_('WF_HELP') . ' : ' . Text::_('WF_' . strtoupper($category) . '_TITLE'));

        switch ($section) {
            case 'admin':
                $file = WF_ADMINISTRATOR . '/models/' . $category . '.xml';
                break;
            case 'editor':
                $file = WF_EDITOR_PLUGINS . '/' . $category . '/' . $category . '.xml';

                $file = Path::find([
                    WF_EDITOR_PLUGINS . '/' . $category,
                    JPATH_PLUGINS . '/system/jcepro/editor/plugins/' . $category,
                    JPATH_PLUGINS . '/jce/editor-' . $category,
                    JPATH_PLUGINS . '/jce/editor_' . $category
                ], $category . '.xml');

                if (!is_file($file)) {
                    $file = WF_EDITOR_LIBRARIES . '/xml/help/editor.xml';
                } else {
                    $path = dirname($file);

                    // installed plugin
                    if (preg_match('/\/editor[_-]/', $path)) {
                        $language->load('plg_jce_editor_' . $category,$path);
                    }                    
                }

                break;
        }

        $result = '';

        $result .= '<ul class="uk-nav" id="help-menu"><li class="uk-nav-header">' . Text::_('WF_' . strtoupper($category) . '_TITLE') . '</li>';
        $result .= $this->getTopics($file);
        $result .= '</ul>';

        return $result;
    }
}
