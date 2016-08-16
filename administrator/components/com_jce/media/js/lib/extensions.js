/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function($) {
    $.fn.extensionmapper = function(options) {

        return this.each(function() {
          var self = this, value = [], $parent = $(self).parent();

          // create hidden input
          var $input = $('<input type="hidden" name="' + $(this).attr('name') + '" />').val(this.value).insertAfter(this);

          // remove name
          $(this).removeAttr('name').prop('disabled', true);

          function serialize() {
            var list = [];

            $(self).parent().find('dl').each(function() {
              // checkboxes
              var v1 = $(this).find('input[type="checkbox"]').map(function() {
                if (!this.checked) {
                    return "-" + this.value;
                }
                return this.value;
              }).get();
              // custom values
              var v2 = $(this).find('.extension-custom input').map(function() {
                if (this.value !== "") {
                    return this.value;
                }
              }).get();

              var group = $(this).children('dt').data('extension-group') || "";
              var items = $.merge(v1, v2).join(",");

              if (group) {
                  list.push(group + "=" + items);
              } else {
                  list.push(items);
              }
            });

            var v = list.join(";");

            // set value to hidden input
            $input.val(v).addClass('isdirty');
            // set value to original input
            $(self).val(v);
          }

          $(this).siblings('button').click(function(e) {
            e.preventDefault();
            $(self).siblings('dl').slideToggle();
          });

          // get all checkboxes
          $parent.find('input[type="checkbox"]').click(function() {
            serialize();
          });

          $parent.on('change', '.extension-custom input', function(e) {
            e.preventDefault();
            $(this).siblings('.file').attr("class", "").addClass("file").addClass(this.value);
            serialize();
          });

          $parent.on('click', '.extension-custom .extension-clear', function(e) {
              e.preventDefault();
              $(this).siblings('input').val("");
          });

          $parent.find('.extension-add').click(function(e) {
              e.preventDefault();

              var $p = $(this).parent();

              var clone = $p.clone();
              $(clone).find('input').val("");
              $(clone).insertAfter($p);
          });

          $parent.on('click', '.extension-remove', function(e) {
              e.preventDefault();

              $(this).parent().remove();
              serialize();
          });

          if ($('dt', $parent).length) {
              $('dl', $parent).sortable({
                "axis" : "y",
                "items": "> dd",
                "connectWith": ".extensions dl",
                "update": function(event, ui) {
                  serialize();
                }
              });
          }
        });
    };
})(jQuery);
