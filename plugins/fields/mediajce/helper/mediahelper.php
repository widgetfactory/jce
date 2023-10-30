<?php 

final class WfMediaHelper {
    /**
     * An array of supported embed types and their mime types
     */
    private static $embedMimes = array(
        "doc"=> "application/msword",
        "xls"=> "application/vnd.ms-excel",
        "ppt"=> "application/vnd.ms-powerpoint",
        "dot"=> "application/msword",
        "pps"=> "application/vnd.ms-powerpoint",
        "docx"=> "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "dotx"=> "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
        "pptx"=> "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "xlsx"=> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xlsm"=> "application/vnd.ms-excel.sheet.macroEnabled.12",
        "ppsx"=> "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
        "sldx"=> "application/vnd.openxmlformats-officedocument.presentationml.slide",
        "potx"=> "application/vnd.openxmlformats-officedocument.presentationml.template",
        "xltx"=> "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
        "odt"=> "application/vnd.oasis.opendocument.text",
        "odg"=> "application/vnd.oasis.opendocument.graphics",
        "odp"=> "application/vnd.oasis.opendocument.presentation",
        "ods"=> "application/vnd.oasis.opendocument.spreadsheet",
        "odf"=> "application/vnd.oasis.opendocument.formula",
        "txt"=> "text/plain",
        "rtf"=> "application/rtf",
        "md"=> "text/markdown",
        "pdf"=> "application/pdf"
    );

    /**
     * An array of supported media layout types and their file extensions
     */
    private static $allowable = array(
        'image'     => 'jpg,jpeg,png,gif',
        'audio'     => 'mp3,m4a,mp4a,ogg',
        'video'     => 'mp4,mp4v,mpeg,mov,webm',
        'object'    => 'doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv',
        'iframe'    => '',
    );

    /**
     * Get the embed type from the file extension
     *
     * @param [string] $extension File extension
     * @return Mime type or false
     */
    public static function getMimeType($extension) {
        if (array_key_exists($extension, self::$embedMimes)) {
            return self::$embedMimes[$extension];
        }

        return false;
    }
    /**
     * Get the media layout from the file extension
     *
     * @param [type] $extension File extension
     * @return Layout type
     */
    public static function getLayoutFromExtension($extension) {
        $layout = 'link';
        
        array_walk(self::$allowable, function ($values, $key) use ($extension, &$layout) {
            if (in_array($extension, explode(',', $values))) {
                $layout = $key;
            }
        });

        return $layout;
    }

    /**
     * Determine whether the value is an image
     *
     * @param [string] $value
     * @return boolean
     */
    public static function isImage($value) {
        $extension = pathinfo($value, PATHINFO_EXTENSION);
        return in_array($extension, explode(',', self::$allowable['image']));
    }
}