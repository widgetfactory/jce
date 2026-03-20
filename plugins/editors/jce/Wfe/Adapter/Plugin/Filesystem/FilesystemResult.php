<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Adapter\Plugin\Filesystem;

\defined('_JEXEC') or die;

final class FilesystemResult
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
    /*
     * @var Original Source path
     */
    public $source = null;

    public function __construct() {}
}