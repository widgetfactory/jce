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

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\User\UserHelper;

class WFFileSystem extends WFExtension
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        parent::__construct($config);

        $this->setProperties(array_merge($config, array(
            'local' => true,
        )));

        // get path variable properties
        $vars = $this->getPathVariables();

        // assign to instance
        $this->setProperties($vars);
    }

    protected function getProfile()
    {
        $wf = WFApplication::getInstance();
        return $wf->getActiveProfile();
    }

    /**
     * Returns a reference to a plugin object.
     *
     * @return JCE The editor object
     *
     * @since 1.5
     */
    public static function getInstance($type = 'joomla', $config = array())
    {
        static $instances = array();

        $signature = md5($type . serialize($config));

        if (!isset($instances[$signature])) {
            $fs = parent::loadExtensions('filesystem', $type);

            // load the default...
            if (empty($fs)) {
                $fs = parent::loadExtensions('filesystem', 'joomla');
            }

            // get the first filesystem extension only
            if (is_array($fs)) {
                $fs = array_shift($fs);
            }

            $classname = 'WF' . ucfirst($fs->name) . 'FileSystem';

            if (class_exists($classname)) {
                $instances[$signature] = new $classname($config);
            } else {
                $instances[$signature] = new self($config);
            }
        }

        return $instances[$signature];
    }

    public function updateOptions(&$options)
    {
        $options['dir'] = $this->getRootDir();
    }

    /**
     * Get the base directory.
     *
     * @return string base dir
     */
    public function getBaseDir()
    {
        return WFUtility::makePath(JPATH_SITE, $this->getRootDir());
    }

    /**
     * Get the full base url.
     *
     * @return string base url
     */
    public function getBaseURL()
    {
        return WFUtility::makePath(Uri::root(true), $this->getRootDir());
    }

    private function getPathVariables()
    {
        static $variables;

        if (!isset($variables)) {
            $app = Factory::getApplication();
            $user = Factory::getUser();
            $wf = WFApplication::getInstance();
            $profile = $this->getProfile();

            $groups = UserHelper::getUserGroups($user->id);

            // get keys only
            $groups = array_keys($groups);

            // get the first group
            $group_id = array_shift($groups);

            if (is_int($group_id)) {
                // usergroup table
                $group = Table::getInstance('Usergroup');
                $group->load($group_id);
                // usertype
                $usertype = $group->title;
            } else {
                $usertype = $group_id;
            }

            $context = $app->input->getInt('context', null);

            $contextName = '';

            if (is_int($context)) {
                foreach (ComponentHelper::getComponents() as $component) {
                    if ($context == $component->id) {
                        $contextName = $component->option;
                        break;
                    }
                }
            }

            // Replace any path variables
            $path_pattern = array(
                '/\$id/',
                '/\$username/',
                '/\$name/',
                '/\$user(group|type)/',
                '/\$(group|profile)/',
                '/\$context/',
                '/\$hour/',
                '/\$day/',
                '/\$month/',
                '/\$year/',
            );

            $path_replacement = array(
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'usertype' => $usertype,
                'profile' => $profile->name,
                'context' => $contextName,
                'hour' => date('H'),
                'day' => date('d'),
                'month' => date('m'),
                'year' => date('Y')
            );

            Factory::getApplication()->triggerEvent('onWfFileSystemBeforeGetPathVariables', array(&$path_replacement, &$path_pattern));

            // convert to array values
            $path_replacement = array_values($path_replacement);

            // get websafe options
            $websafe_textcase = $wf->getParam('editor.websafe_textcase', '');
            $websafe_mode = $wf->getParam('editor.websafe_mode', 'utf-8');
            $websafe_allow_spaces = $wf->getParam('editor.websafe_allow_spaces', '_');

            // implode textcase array to create string
            if (is_array($websafe_textcase)) {
                $websafe_textcase = implode(',', $websafe_textcase);
            }
            
            // expose variables
            $variables = compact('path_pattern', 'path_replacement', 'websafe_textcase', 'websafe_mode', 'websafe_allow_spaces');
        }

        Factory::getApplication()->triggerEvent('onWfFileSystemGetPathVariables', array(&$variables));

        return $variables;
    }

    public function processPath(&$path)
    {
        $path = preg_replace($this->get('path_pattern', array()), $this->get('path_replacement', array()), $path);

        // split into path parts to preserve /
        $parts = explode('/', $path);

        // clean path parts
        $parts = WFUtility::makeSafe($parts, $this->get('websafe_mode', 'utf-8'), $this->get('websafe_allow_spaces', '_'), $this->get('websafe_textcase', ''));

        // join path parts
        $path = implode('/', $parts);
    }

    /**
     * Return the full user directory path. Create if required.
     *
     * @param string  The base path
     *
     * @return Full path to folder
     */
    public function getRootDir()
    {
        static $root;

        if (!isset($root)) {
            // Get base directory as shared parameter
            $root = $this->get('dir', '');

            // Remove whitespace
            $root = trim($root);

            if (!empty($root)) {
                // Convert slashes / Strip double slashes
                $root = preg_replace('/[\\\\]+/', '/', $root);

                // Remove first leading slash
                $root = ltrim($root, '/');

                // Force default directory if base param is now empty or starts with a variable or a . eg $id
                if (empty($root) || preg_match('/[\.\$]/', $root[0])) {
                    $root = 'images';
                }

                Factory::getApplication()->triggerEvent('onWfFileSystemBeforeGetRootDir', array(&$root));

                $this->processPath($root);
            }
        }

        return $root;
    }

    protected static function sortItemsByKey($items, $type)
    {
        $sortable = array();

        // set default direction
        $direction = 'asc';

        if ($type[0] === '-') {
            $direction = 'desc';
            $type = substr($type, 1);
        }

        foreach ($items as $key => $item) {
            $sortable[$key] = isset($item[$type]) ? $item[$type] : $item['properties'][$type];
        }

        array_multisort($sortable, $direction === 'desc' ? SORT_DESC : SORT_ASC, SORT_NATURAL | SORT_FLAG_CASE, $items);

        return $items;
    }

    public function toAbsolute($path)
    {
        return $path;
    }

    public function toRelative($path)
    {
        return $path;
    }

    public function getTotalSize($path, $recurse = true)
    {
        return 0;
    }

    public function countFiles($path, $recurse = false)
    {
        return 0;
    }

    public function getFiles($path, $filter)
    {
        return array();
    }

    public function getFolders($path, $filter)
    {
        return array();
    }

    public function getSourceDir($path)
    {
        return $path;
    }

    public function isMatch($needle, $haystack)
    {
        return $needle == $haystack;
    }

    public function pathinfo($path)
    {
        return pathinfo($path);
    }

    public function delete($path)
    {
        return true;
    }

    public function createFolder($path, $new)
    {
        return true;
    }

    public function rename($src, $dest)
    {
        return true;
    }

    public function copy($src, $dest)
    {
        return true;
    }

    public function move($src, $dest)
    {
        return true;
    }

    public function getFolderDetails($path)
    {
        return array(
            'properties' => array('modified' => ''),
        );
    }

    public function getFileDetails($path)
    {
        $data = array(
            'properties' => array(
                'size' => '',
                'modified' => '',
            ),
        );

        if (preg_match('#\.(jpg|jpeg|bmp|gif|tiff|png)#i', $path)) {
            $image = array(
                'properties' => array(
                    'width' => 0,
                    'height' => 0,
                    'preview' => '',
                ),
            );

            return array_merge_recursive($data, $image);
        }

        return $data;
    }

    public function getDimensions($path)
    {
        return array(
            'width' => '',
            'height' => '',
        );
    }

    public function upload($method, $src, $dir, $name, $chunks = 0, $chunk = 0)
    {
        return true;
    }

    public function exists($path)
    {
        return true;
    }

    public function read($path)
    {
        return '';
    }

    public function write($path, $content)
    {
        return true;
    }

    public function isLocal()
    {
        return $this->get('local') === true;
    }

    public function is_file($path)
    {
        return true;
    }

    public function is_dir($path)
    {
        return true;
    }
}

/**
 * Filesystem Error class.
 */
final class WFFileSystemResult
{
    /*
     * @var Object type eg: file / folder
     */

    public $type = 'files';
    /*
     * @boolean    Result state
     */
    public $state = false;
    /*
     * @int    Error code
     */
    public $code = null;
    /*
     * @var Error message
     */
    public $message = null;
    /*
     * @var File / Folder path
     */
    public $path = null;
    /*
     * @var File / Folder url
     */
    public $url = null;

    public function __construct()
    {
    }
}
