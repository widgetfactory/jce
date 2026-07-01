<?php

/**
 * @package     JCE
 * @subpackage  Library.wfe
 *
 * @copyright   Copyright (c) 2026-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Application;

use Joomla\CMS\Language\Text;
use Wfe\Utility\Utility;
use Wfe\Utility\MimeType;

trait UploadValidationTrait
{
    /**
     * Validate an uploaded file: presence, name safety, content safety, size, and MIME type.
     * Throws \InvalidArgumentException on any failure; deletes the temp file before throwing.
     *
     * @param array $file $_FILES entry
     */
    private function validateUploadedFile($file)
    {
        if (empty($file) || empty($file['tmp_name'])) {
            throw new \InvalidArgumentException('Upload Failed: No data');
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            throw new \InvalidArgumentException('Upload Failed: Not an uploaded file');
        }

        $upload = $this->getConfig('upload');

        if (strpos($file['name'], "\x00") !== false) {
            @unlink($file['tmp_name']);
            throw new \InvalidArgumentException(Text::_('WF_MANAGER_UPLOAD_INVALID_EXT_ERROR'));
        }

        $allowed = (array) $this->getFileTypes('array');

        if (Utility::validateFileName($file['name'], $allowed) === false) {
            @unlink($file['tmp_name']);
            throw new \InvalidArgumentException(Text::_('WF_MANAGER_UPLOAD_INVALID_EXT_ERROR'));
        }

        $ext = Utility::getExtension($file['name'], true);

        Utility::isSafeFile($file, $allowed);

        if (is_array($allowed) && !empty($allowed) && in_array($ext, $allowed) === false) {
            @unlink($file['tmp_name']);
            throw new \InvalidArgumentException(Text::_('WF_MANAGER_UPLOAD_INVALID_EXT_ERROR'));
        }

        $size = round(filesize($file['tmp_name']) / 1024);

        if (empty($upload['max_size'])) {
            $upload['max_size'] = 10240;
        }

        if ($size > (int) $upload['max_size']) {
            @unlink($file['tmp_name']);
            throw new \InvalidArgumentException(Text::sprintf('WF_MANAGER_UPLOAD_SIZE_ERROR', $file['name'], $size, $upload['max_size']));
        }

        if ($upload['validate_mimetype']) {
            if (MimeType::check($file['name'], $file['tmp_name']) === false) {
                @unlink($file['tmp_name']);
                throw new \InvalidArgumentException(Text::_('WF_MANAGER_UPLOAD_MIME_ERROR'));
            }
        }
    }

    /**
     * Validate the upload destination directory and quota limits.
     * Returns the resolved directory path on success; throws on any failure.
     *
     * @param  string $dir    Raw destination path (post-event)
     * @param  array  $upload Upload settings from profile config
     * @return string         Resolved, validated directory path
     */
    private function validateUploadDirectory($dir, $upload)
    {
        Utility::checkPath($dir);

        if (empty($dir)) {
            $dir = $this->getDefaultPath();
        }

        $dir = $this->resolvePath($dir);

        if (empty($dir)) {
            throw new \InvalidArgumentException('Upload Failed: Invalid target directory');
        }

        $filesystem = $this->getFileSystem();

        if (!$filesystem->is_dir($dir)) {
            throw new \InvalidArgumentException('Upload Failed: The target directory does not exist');
        }

        if (!$this->checkPathAccess($dir)) {
            throw new \InvalidArgumentException('Upload Failed: Access to the target directory is restricted');
        }

        if (!empty($upload['total_files'])) {
            if ($filesystem->countFiles($dir, true) > $upload['total_files']) {
                throw new \InvalidArgumentException(Text::_('WF_MANAGER_FILE_LIMIT_ERROR'));
            }
        }

        if (!empty($upload['total_size'])) {
            $size = $filesystem->getTotalSize($dir);

            if (($size / 1024 / 1024) > $upload['total_size']) {
                throw new \InvalidArgumentException(Text::_('WF_MANAGER_FILE_SIZE_LIMIT_ERROR'));
            }
        }

        return $dir;
    }
}
