<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Http;

\defined('_JEXEC') or die;

/**
 * JSON-RPC 2.0 response for editor requests.
 *
 * Collects the result, error and headers for a single request, then writes the encoded body and
 * ends the request. A response carries either a result or an error, never both, and is only
 * written when there is an id to correlate it with or an error to report.
 */
final class Response
{
    /**
     * @var mixed Response result, encoded as the "result" member
     */
    private $content = null;

    /**
     * @var mixed Id of the request being answered, echoed back to the caller
     */
    private $id = null;

    /**
     * @var array|null Error object with "code" and "message" members, or null when the request succeeded
     */
    private $error = null;

    /**
     * @var array Response headers, sent after the no-cache headers
     */
    private $headers = array(
        'Content-Type' => 'application/json;charset=UTF-8',
    );

    /**
     * Constructor.
     *
     * @param mixed $id      Request id, echoed back so the caller can match the response
     * @param mixed $content Response content
     * @param array $headers Headers merged over the defaults
     */
    public function __construct($id, $content = null, $headers = array())
    {
        // set response content
        $this->setContent($content);

        // set id
        $this->id = $id;

        // set header
        $this->setHeaders($headers);

        return $this;
    }

    /**
     * Send the response and end the request.
     *
     * Sends no-cache headers followed by the custom headers, writes the encoded body and exits, so
     * nothing after this call runs. Any output buffered by the request is discarded.
     *
     * @param array $data Additional members to include in the response body
     *
     * @return void This method does not return
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

        // only echo response if an id is set, or an error must be reported. A parse failure
        // loses the id with the body, and a silent 200 is indistinguishable from success
        if (!empty($this->id) || !empty($this->error)) {
            echo json_encode($data);
        }

        exit(ob_get_clean());
    }

    /**
     * Get the response headers.
     *
     * @return array The headers as key => value pairs
     */
    public function getHeader()
    {
        return $this->headers;
    }

    /**
     * Set response headers, merging over any already set.
     *
     * @param array $headers Headers as key => value pairs
     *
     * @return Response This object, for chaining
     */
    public function setHeaders($headers)
    {
        foreach ($headers as $key => $value) {
            $this->headers[$key] = $value;
        }

        return $this;
    }

    /**
     * Set the error reported by this response.
     *
     * @param array $error Error object with "code" and "message" members, defaulting to an internal error
     *
     * @return Response This object, for chaining
     */
    public function setError($error = array('code' => -32603, 'message' => 'Internal error'))
    {
        $this->error = $error;

        return $this;
    }

    /**
     * Get the error reported by this response.
     *
     * @return array|null The error object, or null if no error was set
     */
    public function getError()
    {
        return $this->error;
    }

    /**
     * Get the response content.
     *
     * @return mixed The content
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * Set the response content.
     *
     * @param mixed $content The content
     *
     * @return Response This object, for chaining
     */
    public function setContent($content)
    {
        $this->content = $content;

        return $this;
    }
}
