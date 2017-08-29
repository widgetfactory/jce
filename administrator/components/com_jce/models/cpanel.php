<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

// load base model
require_once dirname(__FILE__) . '/model.php';

class WFModelCpanel extends WFModel
{
    public function getVersion()
    {
        $xml = WFXMLHelper::parseInstallManifest(JPATH_ADMINISTRATOR . '/components/com_jce/jce.xml');

        return $xml['version'];
    }

    public function getLicense()
    {
        return '<a href="http://www.gnu.org/licenses/old-licenses/gpl-2.0.html" title="GNU General Public License, version 2" target="_blank">GNU General Public License, version 2</a>';
    }

    public function getFeeds()
    {
        $app = JFactory::getApplication();
        $params = JComponentHelper::getParams('com_jce');
        $limit = $params->get('feed_limit', 2);

        $feeds = array();
        $options = array(
            'rssUrl' => 'https://www.joomlacontenteditor.net/news?format=feed',
        );

        $xml = simplexml_load_file($options['rssUrl']);

        if (empty($xml)) {
            return $feeds;
        }

        jimport('joomla.filter.input');
        $filter = JFilterInput::getInstance();

        $count = count($xml->channel->item);

        if ($count) {
            $count = ($count > $limit) ? $limit : $count;

            for ($i = 0; $i < $count; ++$i) {
                $feed = new StdClass();
                $item = $xml->channel->item[$i];

                $link = (string) $item->link;
                $feed->link = htmlspecialchars($filter->clean($link));

                $title = (string) $item->title;
                $feed->title = htmlspecialchars($filter->clean($title));

                $description = (string) $item->description;
                $feed->description = htmlspecialchars($filter->clean($description));

                $feeds[] = $feed;
            }
        }

        return $feeds;
    }
}
