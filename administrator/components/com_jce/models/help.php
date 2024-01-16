<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\CMS\Plugin\PluginHelper;

class JceModelHelp extends BaseDatabaseModel
{
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
                    $class = count($subtopics) ? 'subtopics' : '';

                    $key = (string) $topic->attributes()->key;
                    $title = (string) $topic->attributes()->title;
                    $file = (string) $topic->attributes()->file;

                    // if file attribute load file
                    if ($file) {
                        $result .= $this->getTopics(JPATH_SITE . '/components/com_jce/editor/' . $file);
                    } else {
                        $result .= '<li id="' . $key . '" class="nav-item ' . $class . '"><a href="#" class="nav-link"><i class="icon-copy"></i>&nbsp;' . trim(Text::_($title)) . '</a>';
                    }

                    if (count($subtopics)) {
                        $result .= '<ul class="nav nav-list hidden">';
                        foreach ($subtopics as $subtopic) {
                            $sub_subtopics = $subtopic->subtopic;

                            // if a file is set load it as sub-subtopics
                            if ($file = (string) $subtopic->attributes()->file) {
                                $result .= '<li class="nav-item subtopics"><a href="#" class="nav-link"><i class="icon-file"></i>&nbsp;' . trim(Text::_((string) $subtopic->attributes()->title)) . '</a>';
                                $result .= '<ul class="nav nav-list hidden">';
                                $result .= $this->getTopics(JPATH_SITE . '/components/com_jce/editor/' . $file);
                                $result .= '</ul>';
                                $result .= '</li>';
                            } else {
                                $id = $subtopic->attributes()->key ? ' id="' . (string) $subtopic->attributes()->key . '"' : '';

                                $class = count($sub_subtopics) ? ' class="nav-item subtopics"' : '';
                                $result .= '<li' . $class . $id . '><a href="#" class="nav-link"><i class="icon-file"></i>&nbsp;' . trim(Text::_((string) $subtopic->attributes()->title)) . '</a>';

                                if (count($sub_subtopics)) {
                                    $result .= '<ul class="nav nav-list hidden">';
                                    foreach ($sub_subtopics as $sub_subtopic) {
                                        $result .= '<li id="' . (string) $sub_subtopic->attributes()->key . '" class="nav-item"><a href="#" class="nav-link"><i class="icon-file"></i>&nbsp;' . trim(Text::_((string) $sub_subtopic->attributes()->title)) . '</a></li>';
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
                $file = __DIR__ . '/' . $category . '.xml';
                break;
            case 'editor':
                $file = JPATH_SITE . '/components/com_jce/editor/tiny_mce/plugins/' . $category . '/' . $category . '.xml';

                // check for installed plugin
                $plugin = PluginHelper::getPlugin('jce', 'editor-' . $category);

                if ($plugin) {
                    $file = JPATH_PLUGINS . '/jce/editor-' . $category . '/editor-' . $category . '.xml';
                    $language->load('plg_jce_editor_' . $category, JPATH_ADMINISTRATOR);
                }

                if (!is_file($file)) {
                    $file = JPATH_SITE . '/components/com_jce/editor/libraries/xml/help/editor.xml';
                } else {
                    $language->load('WF_' . $category, JPATH_SITE);
                }
                break;
        }

        $result = '';

        $result .= '<ul class="nav nav-list" id="help-menu"><li class="nav-header">' . Text::_('WF_' . strtoupper($category) . '_TITLE') . '</li>';
        $result .= $this->getTopics($file);
        $result .= '</ul>';

        return $result;
    }
}
