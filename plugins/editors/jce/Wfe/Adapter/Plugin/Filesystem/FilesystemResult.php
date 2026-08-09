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

/**
 * Result of a filesystem operation.
 *
 * Returned by the write operations (delete, rename, copy, move, upload, createFolder). The browser
 * reads $state to decide whether the operation succeeded, $message to report a failure, and $path
 * and $url to describe the item to the client.
 */
final class FilesystemResult
{
    /**
     * The item type, files or folders.
     *
     * @var string
     */
    public $type = 'files';

    /**
     * Whether the operation succeeded.
     *
     * @var bool
     */
    public $state = false;

    /**
     * Error code, when the adapter provides one.
     *
     * @var int
     */
    public $code = null;

    /**
     * Error message, shown to the user when the operation fails.
     *
     * @var string
     */
    public $message = null;

    /**
     * Path of the resulting file or folder.
     *
     * @var string
     */
    public $path = null;

    /**
     * Url of the resulting file or folder.
     *
     * @var string
     */
    public $url = null;

    /**
     * Original source path, for operations that move or copy an item.
     *
     * @var string
     */
    public $source = null;

    public function __construct() {}
}