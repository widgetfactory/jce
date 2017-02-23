<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die('RESTRICTED');

/**
 * Renders a select element.
 */
class WFElementFilesystem extends WFElement
{
    /*
     * Element type
     *
     * @access	protected
     * @var		string
     */
    public $_name = 'Filesystem';

    public function fetchElement($name, $value, &$node, $control_name)
    {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $parent = $this->getParent();

        $language = JFactory::getLanguage();

        // create a unique id
        $id = preg_replace('#([^a-z0-9_-]+)#i', '', $control_name.'filesystem'.$name);

        $attribs = array('class="parameter-nested-parent"');

        // path to directory
        $path = WF_EDITOR_EXTENSIONS.'/filesystem';
        $files = JFolder::files($path, '\.xml$', false, true);

        // get all installed plugins
        $installed = self::getInstalledPlugins();

        if (!empty($installed)) {
            foreach ($installed as $p) {
                $path = JPATH_PLUGINS.'/jce/'.$p->name;

              // Joomla 1.5!!
              if (!defined('JPATH_PLATFORM')) {
                  $path = JPATH_PLUGINS.'/jce';
              }

                $files[] = $path.'/'.$p->name.'.xml';
            }
        }

        $options = array();

        if ((bool) $node->attributes()->exclude_default === false) {
            $options[] = JHTML::_('select.option', '', WFText::_('WF_OPTION_NOT_SET'));
        }

        $params = array();

        foreach ($files as $file) {
            $filename = basename($file, '.xml');
            // get file name without extension type
            $parts = explode('-', $filename);
            $filename = array_pop($parts);

            // legacy
            $language->load('com_jce_filesystem_'.$filename, JPATH_SITE);
            // new
            $language->load('plg_jce_filesystem-'.$filename, JPATH_ADMINISTRATOR);

            $instance = new WFParameter($parent->getData(), $file);

            $params[$filename] = $instance;

            $xml = WFXMLHelper::parseInstallManifest($file);
            $options[] = JHTML::_('select.option', $filename, WFText::_($xml['name']));
        }

        // if a group is specified, setup to be an object
        if ((string) $node->attributes()->group) {
            $ctrl = $control_name.'[filesystem]['.$name.']';
        } else {
            $ctrl = $control_name.'[filesystem]';
        }

        $html = '';
        $html .= JHTML::_('select.genericlist', $options, $ctrl, implode(' ', $attribs), 'value', 'text', $value, $id);

        foreach ($params as $filesystem => $item) {
            $ctrl = $control_name.'[filesystem]['.$filesystem.']';

            $html .= '<div data-parameter-nested-item="'.$filesystem.'" class="well well-small">';
            $html .= $item->render($ctrl, $filesystem);
            $html .= '</div>';
        }

        return $html;
    }

    protected static function getInstalledPlugins()
    {
        $db = JFactory::getDBO();
        $user = JFactory::getUser();

        // Joomla! 2.5+
        if (defined('JPATH_PLATFORM')) {
            $levels = implode(',', $user->getAuthorisedViewLevels());

            $query = $db->getQuery(true)
            ->select('element AS name')
            ->from('#__extensions')
            ->where('enabled = 1')
            ->where('type = '.$db->quote('plugin'))
            ->where('folder = '.$db->quote('jce'))
            ->where('element LIKE '.$db->quote('filesystem-%'))
            ->where('state IN (0,1)')
            ->where('access IN ('.$levels.')')
            ->order('ordering');

            return $db->setQuery($query)->loadObjectList();
        } else {
            $aid = $user->get('aid', 0);

            $query = 'SELECT element AS name'
            .' FROM #__plugins'
            .' WHERE published >= 1'
            .' AND folder = '.$db->quote('jce')
            .' AND element LIKE '.$db->quote('filesystem-%')
            .' AND access <= '.(int) $aid
            .' ORDER BY ordering';

            $db->setQuery($query);

            return $db->loadObjectList();
        }
    }
}
