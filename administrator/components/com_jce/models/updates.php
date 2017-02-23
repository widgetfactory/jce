<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

// load base model
require_once dirname(__FILE__).'/model.php';

// load helper class
require_once dirname(dirname(__FILE__)).'/helpers/updates.php';

class WFModelUpdates extends WFModel
{
    protected static $updateURL = 'https://www.joomlacontenteditor.net/index.php?option=com_updates&format=raw';

    public static function canUpdate()
    {
        if (defined('JPATH_PLATFORM')) {
            return false;
        }

        if (UpdatesHelper::hasCURL() === false) {
            return UpdatesHelper::hasFOPEN();
        }

        return true;
    }

    /**
     * Get extension versions.
     *
     * @return array
     */
    public function getVersions()
    {
        $db = JFactory::getDBO();

        jimport('joomla.installer.helper');

        $versions = array('joomla' => array(), 'jce' => array());

        // Get Component xml
        $com_xml = JApplicationHelper::parseXMLInstallFile(JPATH_ADMINISTRATOR.'/components/com_jce/jce.xml');

        // set component version
        $component = 'com_jce';

        if (is_dir(JPATH_COMPONENT_SITE.'/editor/libraries/pro')) {
            $component = 'com_jce_pro';
        }

        $versions['joomla'][$component] = str_replace('pro-', '', $com_xml['version']);

        // get mediabox version
        $mediabox_xml_file = JPATH_PLUGINS.'/system/jcemediabox.xml';

        // set mediabox version
        if (file_exists($mediabox_xml_file)) {
            $mediabox_xml = JApplicationHelper::parseXMLInstallFile($mediabox_xml_file);
            $versions['joomla']['plg_jcemediabox'] = $mediabox_xml['version'];
        }

        $plugins = JFolder::files(JPATH_PLUGINS.'/jce', '\.xml$', false, true);

        if (!empty($plugins)) {
            foreach ($plugins as $plugin) {
                $name = str_replace('editor-', '', basename($plugin));

                $xml = WFXMLHelper::parseInstallManifest($plugin);

                $versions['jce']['jce_'.$name] = $xml['version'];
            }
        }

        return $versions;
    }

    /**
     * Check for extension updates.
     *
     * @return string JSON string of updates
     */
    public function check()
    {
        $result = false;

        // Get all extensions and version numbers
        $data = array('task' => 'check', 'jversion' => '1.5');

        $key = '';

        $component = JComponentHelper::getComponent('com_jce');
        $params = json_decode($component->params);

        if ($params && isset($params->preferences) && isset($params->preferences->updates_key)) {
            $key = $params->preferences->updates_key;
        }

        // encode it
        if (!empty($key)) {
            $data['key'] = urlencode($key);
        }

        $req = array();

        // create request data
        foreach ($this->getVersions() as $type => $extension) {
            foreach ($extension as $item => $value) {
                $data[$type.'['.urlencode($item).']'] = urlencode($value);
            }
        }

        foreach ($data as $key => $value) {
            $req[] = $key.'='.urlencode($value);
        }

        // connect
        $result = $this->connect(self::$updateURL, implode('&', $req));

        return $result;
    }

    /**
     * Download update.
     *
     * @return string JSON string
     */
    public function download()
    {
        $app = JFactory::getApplication();

        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $config = JFactory::getConfig();

        $result = array('error' => WFText::_('WF_UPDATES_DOWNLOAD_ERROR'));

        $id = JRequest::getInt('id');

        $key = '';

        $component = JComponentHelper::getComponent('com_jce');
        $params = json_decode($component->params);

        if ($params && isset($params->preferences) && isset($params->preferences->updates_key)) {
            $key = $params->preferences->updates_key;
        }

        $data = $this->connect(self::$updateURL.'&task=download&id='.$id.'&key='.urlencode($key));

        if ($data) {
            $data = json_decode($data);

            if (isset($data->error)) {
                return json_encode(array('error' => $data->error));
            }

            // get update file
            if ($data->name && $data->url && $data->hash) {
                // create path for package file
                $path = $app->getCfg('tmp_path').'/'.basename($data->name);
                // download file
                if ($this->connect($data->url, null, $path)) {
                    if (JFile::exists($path) && @filesize($path) > 0) {
                        // check hash and file type
                        if ($data->hash == md5(md5_file($path)) && preg_match('/\.(zip|tar|gz)$/', $path)) {
                            $result = array('file' => basename($path), 'hash' => $data->hash, 'installer' => $data->installer, 'type' => isset($data->type) ? $data->type : '');
                        } else {
                            // fail and delete file
                            $result = array('error' => WFText::_('WF_UPDATES_ERROR_FILE_VERIFICATION_FAIL'));
                            if (JFile::exists($path)) {
                                @JFile::delete($path);
                            }
                        }
                    } else {
                        $result = array('error' => WFText::_('WF_UPDATES_ERROR_FILE_MISSING_OR_INVALID'));
                    }
                } else {
                    $result = array('error' => WFText::_('WF_UPDATES_DOWNLOAD_ERROR_DATA_TRANSFER'));
                }
            } else {
                $result = array('error' => WFText::_('WF_UPDATES_DOWNLOAD_ERROR_MISSING_DATA'));
            }
        }

        return json_encode($result);
    }

    /**
     * Install extension update.
     *
     * @return string JSON string
     */
    public function install()
    {
        jimport('joomla.installer.installer');
        jimport('joomla.installer.helper');
        jimport('joomla.filesystem.file');

        $app = JFactory::getApplication();
        $result = array('error' => WFText::_('WF_UPDATES_INSTALL_ERROR'));

        // get vars
        $file = JRequest::getCmd('file');
        $hash = JRequest::getVar('hash', '', 'POST', 'alnum');
        $method = JRequest::getWord('installer');
        $type = JRequest::getWord('type');

        // check for vars
        if ($file && $hash && $method) {
            $path = $app->getCfg('tmp_path').'/'.$file;
            // check if file exists
            if (JFile::exists($path)) {
                // check hash
                if ($hash == md5(md5_file($path))) {
                    $package = JInstallerHelper::unpack($path);

                    if ($package) {
                        jimport('joomla.installer.installer');

                        // get new Installer instance
                        $installer = JInstaller::getInstance();

                        if ($installer->install($package['dir'])) {
                            // installer message
                            $result = array('error' => '', 'text' => WFText::_($installer->get('message'), $installer->get('message')));
                        }
                        // Cleanup the install files
                        JInstallerHelper::cleanupInstall($package['packagefile'], $package['extractdir']);
                    } else {
                        $result = array('error' => WFText::_('WF_UPDATES_ERROR_FILE_EXTRACT_FAIL'));
                        JFile::delete($path);
                    }
                } else {
                    $result = array('error' => WFText::_('WF_UPDATES_ERROR_FILE_VERIFICATION_FAIL'));
                }
            } else {
                $result = array('error' => WFText::_('WF_UPDATES_ERROR_FILE_MISSING_OR_INVALID'));
            }
        }

        return json_encode($result);
    }

    /**
     * @copyright   Copyright (C) 2009 Ryan Demmer. All rights reserved
     * @copyright   Copyright (C) 2006-2010 Nicholas K. Dionysopoulos
     *
     * @param string $url      URL to resource
     * @param array  $data     [optional] Array of key value pairs
     * @param string $download [optional] path to file to write to
     *
     * @return mixed Boolean or JSON String on error
     */
    protected function connect($url, $data = '', $download = '')
    {
        @error_reporting(E_ERROR);

        $result = false;

        if ($download) {
            return UpdatesHelper::download($url, $download);
        } else {
            $result = UpdatesHelper::check($url, $data);

            if ($result === false) {
                return array('error' => WFText::_('Update check failed : Invalid response from update server'));
            }
        }

        return $result;
    }
}
