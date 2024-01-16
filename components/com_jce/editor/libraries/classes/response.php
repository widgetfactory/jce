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

final class WFResponse
{
    private $content = null;

    private $id = null;

    private $error = null;

    private $headers = array(
        'Content-Type' => 'application/json;charset=UTF-8',
    );

    /**
     * Constructor.
     *
     * @param $id Request id
     * @param null $content Response content
     * @param array $headers Optional headers
     */
    public function __construct($id, $content = null, $headers = array())
    {
        // et response content
        $this->setContent($content);

        // set id
        $this->id = $id;

        // set header
        $this->setHeaders($headers);

        return $this;
    }

    /**
     * Send response.
     *
     * @param array $data
     */
    public function send($data = array())
    {
        $data = array_merge($data, array(
            'jsonrpc' => '2.0',
            'id' => $this->id,
            'result' => $this->getContent(),
            'error' => $this->getError(),
        ));

        ob_start();

        // set output headers
        header('Expires: Mon, 04 Apr 1984 05:00:00 GMT');
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
        header('Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
        header('Pragma: no-cache');

        // set custom headers
        foreach ($this->headers as $key => $value) {
            header($key . ': ' . $value);
        }

        // only echo response if an id is set
        if (!empty($this->id)) {
            echo json_encode($data);
        }

        exit(ob_get_clean());
    }

    public function getHeader()
    {
        return $this->headers;
    }

    public function setHeaders($headers)
    {
        foreach ($headers as $key => $value) {
            $this->headers[$key] = $value;
        }

        return $this;
    }

    /**
     * @param array $error
     */
    public function setError($error = array('code' => -32603, 'message' => 'Internal error'))
    {
        $this->error = $error;

        return $this;
    }

    public function getError()
    {
        return $this->error;
    }

    public function getContent()
    {
        return $this->content;
    }

    public function setContent($content)
    {
        $this->content = $content;

        return $this;
    }
}
