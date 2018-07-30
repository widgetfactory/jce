(function ($) {
  $.fn.tabs = function (options) {
    return this.each(function () {
      var el = this;

      if ($(this).data('tabs')) {
        return this;
      }

      $(this).find('.tab-content .tab-pane').first().addClass('active');

      $(el).children('.nav-tabs').children('li').click(function (e) {
        e.preventDefault();

        // get current active panel
        var panel = $(el).children('.tab-content').children('.tab-pane.active').get(0);

        // get current active tab
        var tab = $(el).children('.nav-tabs').children('li.active').get(0);

        // trigger tab event
        $(el).trigger('tabs.beforeactivate', [tab, panel]);

        // toggle all tabs...
        $(el).children('.nav-tabs').children('li').removeClass('active');
        // ...and panels
        $(el).children('.tab-content').children('.tab-pane').removeClass('active');

        // activate tab
        $(this).addClass('active');

        // activate new panel
        var panel = $(el).children('.tab-content').children('.tab-pane').eq($(this).index()).addClass('active').get(0);

        // trigger tab event
        $(el).trigger('tabs.activate', [this, panel]);

        // kill default events
        e.preventDefault();
      }).first().addClass('active');

      $(this).data('tabs', true);
    });
  };

  $.fn.repeatable = function () {
    return this.each(function () {
      var self = this;

      if ($(this).data('ui-repeatable')) {
        return this;
      }

      $(this).data('ui-repeatable', 1);

      $('.ui-repeatable-create', this).click(function (e) {
        // clone element
        var el = $(self).clone(true, true);

        // clear inputs
        $(el).find('input').val('');

        $(self).trigger('repeatable:create', [self, $(el).get(0)]);

        // add new element
        $(el).insertAfter($(self).siblings('.ui-repeatable').add(self).last());

        $(self).trigger('repeatable:change');

        e.preventDefault();
      });

      $('.ui-repeatable-delete', this).click(function (e) {
        $(this).parent().remove();

        $(self).trigger('repeatable:change');

        e.preventDefault();
      });
    });
  };

  $.fn.popover = function () {
    return $(this).tips();
  }

})(jQuery);