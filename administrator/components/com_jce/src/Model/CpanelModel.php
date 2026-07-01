<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Model;

defined('_JEXEC') or die;

use Joomla\CMS\Application\ApplicationHelper;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Filter\InputFilter;

/**
 * Releases model.
 *
 * @since  1.5
 */
class CpanelModel extends BaseDatabaseModel
{
	/**
	 * The type alias for this content type.
	 *
	 * @var    string
	 * @since  3.0
	 */
	public $typeAlias = 'com_jce.cpanel';
    
    public function getIcons()
    {
        $user = Factory::getApplication()->getIdentity();

        $icons = array();

        $views = array(
            'config' => 'equalizer',
            'profiles' => 'users',
            'filebrowser' => 'picture',
            'mediabox' => 'pictures',
        );

        foreach ($views as $name => $icon) {

            // if its mediabox, check the plugin is installed and enabled
            if ($name == "mediabox" && !PluginHelper::isEnabled('system', 'jcemediabox')) {
                continue;
            }

            // check if its allowed...
            if (!$user->authorise('jce.' . $name, 'com_jce')) {
                continue;
            }

            $link = 'index.php?option=com_jce&amp;view=' . $name;
            $title = Text::_('WF_' . strtoupper($name));

            if ($name == "filebrowser") {
                if (!PluginHelper::isEnabled('quickicon', 'jce')) {
                    continue;
                }
                
                $title = Text::_('WF_' . strtoupper($name) . '_TITLE');
            }

            $icons[] = '<li class="quickicon mb-3"><a title="' . Text::_('WF_' . strtoupper($name) . '_DESC') . '" href="' . $link . '" class="card btn btn-default" role="button"><div class="quickicon-icon d-flex align-items-end" role="presentation"><span class="fa fa-' . $icon . ' icon-' . $icon . '" aria-hidden="true" role="presentation"></span></div><div class="quickicon-text d-flex align-items-center"><span class="j-links-link">' . $title . '</span></div></a></li>';
        }

        return $icons;
    }

    public function getFeeds()
    {
        $params = ComponentHelper::getParams('com_jce');
        $limit = $params->get('feed_limit', 2);

        $feeds = array();
        $options = array(
            'rssUrl' => 'https://www.joomlacontenteditor.net/news?format=feed',
        );

        $xml = simplexml_load_file($options['rssUrl']);

        if (empty($xml)) {
            return $feeds;
        }

        $filter = InputFilter::getInstance();

        $count = count($xml->channel->item);

        if ($count) {
            $count = ($count > $limit) ? $limit : $count;

            for ($i = 0; $i < $count; ++$i) {
                $feed = new \StdClass();
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

    /**
     * Method to auto-populate the model state.
     *
     * Note. Calling getState in this method will result in recursion.
     *
     * @since   1.6
     */
    protected function populateState($ordering = null, $direction = null)
    {
        $licence = "";
        $version = "";

        if ($xml = simplexml_load_file(JPATH_ADMINISTRATOR . '/components/com_jce/jce.xml')) {
            $licence = (string) $xml->license;
            $version = (string) $xml->version;

			$variant = (string) $xml->variant;

            if ($variant == 'pro') {
                $version = '<span class="badge badge-info badge-primary bg-primary">Pro</span>&nbsp;' . $version;
            }
        }
		$this->setState('variant', $variant);
        $this->setState('version', $version);
        $this->setState('licence', $licence);
    }
}
