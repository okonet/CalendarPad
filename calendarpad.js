/* 
  calendarpad.js

  Implements calendar pad with 3 months and an ability to switch months.

  license: MIT-style

  Requiers: 
  
  * Mootools Core 1.2.4
  * Mootools More 1.2.4:
    - Date
    - Hash.Extras
    - String.Extras
    - Element.Delegation
  
  Created by Andrey Okonetchnikov on 2010-07.
  Copyright 2010 wollzelle GmbH (http://wollzelle.com). All rights reserved.
  
*/ 

(function(){
  var $ = document.id;
  
  window.CalendarPad = new Class({

    Implements: [Options, Events],

    options: {
      /*
      'onBuild': $empty,
      'onSelect': $empty,
      */
      'z-index': 1,
      'months': 3,
      'weekStartsOnMonday': true, // Use false for Sunday,
      'weekDayNameLength': 3, // 1 for "M", 3 for "Mon", -1 for "Monday"
      'selectedDate': ''
    },

    initialize: function(element, options) {
      this.setOptions(options);
      this.container = $(element).addClass('calendarpad-component');

      var now = new Date(),
          selected = this.options.selectedDate ? new Date().parse(this.options.selectedDate) : null;
          today = now.clearTime();

      if(selected) {
        // var active  = selected.get('year') + '-' + selected.get('month') + '-' + selected.get('date');
        var month   = selected.get('month');
        var year    = selected.get('year');
      } else {
        var month   = now.get('month');
        var year    = now.get('year');
      }

      this.today = today;
      this.now = now;
      this.active = selected;
      
      // Current visible year/month which is in the middle of the pad
      this.month = month;
      this.year = year;
      
      // Day of week names
      this.dayNames = $A(Date.getMsg('days'));
      if(this.options.weekStartsOnMonday) {
        this.dayNames[0] = null;
        this.dayNames.push(Date.getMsg('days')[0]);
        this.dayNames = this.dayNames.clean();
      }

      // Build HTML
      this.container.empty();
      var controls = new Element('div', { 'class': 'calendarpad-controls' });
      var previous = new Element('a', {
        'class': 'calendarpad-control calendarpad-previous',
        'html': '&laquo;',
        'href': '#'
      }).inject(controls);
      var next = new Element('a', {
        'class': 'calendarpad-control calendarpad-next',
        'html': '&raquo;',
        'href': '#'
      }).inject(controls);
            
      this.pad = this.build(year, month);
      this.wrap = new Element('div', { 'class': 'calendarpad-wrapper' }).grab(this.pad);
      this.container.adopt(controls, this.wrap);
      
      // Add event listeners
      this.container.addEvents({
        'click:relay(.calendarpad-previous)': function(e){
          e.preventDefault();

          var next = new Date(this.year, this.month).decrement('month', 3);
          this.month  = next.get('month');
          this.year   = next.get('year');

          this.pad.addClass('slide-right');
          this.pad = this.build(this.year, this.month).addClass('slide-left');
          this.pad.inject(this.wrap);
          (function(){ this.pad.removeClass('slide-left'); }).delay(1, this); // We need this delay to start animation

          this.fireEvent('onPrevious', [e, this.year, this.month]);

        }.bindWithEvent(this),

        'click:relay(.calendarpad-next)': function(e){
          e.preventDefault();

          var next = new Date(this.year, this.month).increment('month', 3);
          this.month  = next.get('month');
          this.year   = next.get('year');

          this.pad.addClass('slide-left');
          this.pad = this.build(this.year, this.month).addClass('slide-right');
          this.pad.inject(this.wrap);
          (function(){ this.pad.removeClass('slide-right'); }).delay(1, this); // We need this delay to start animation

          this.fireEvent('onNext', [e, this.year, this.month]);

        }.bindWithEvent(this)
      });

      ['webkitTransitionEnd', 'mozTransitionEnd', 'oAnimationFinish'].each(function(eventName){
        this.container.addEventListener(eventName, function(e){
          if(e.target.hasClass('slide-right') || e.target.hasClass('slide-left')) e.target.destroy();
        }, false);
      }.bind(this));
    },
    
    build: function(year, month){
      var curr = new Date(year, month),
          next = new Date(year, month).increment('month', 1),
          prev = new Date(year, month).decrement('month', 1),
          pad  = new Element('div', { 'class': 'calendarpad-months' });
      
      [prev, curr, next].each(function(d){
        this.renderMonth(d.get('year'), d.get('month')).inject(pad);
      }.bind(this));
      
      this.fireEvent('onBuild');
      return pad;
    },
    
    renderMonth: function(year, month) {
      var self = this,
          calendar = new Element('div', { 'class': 'calendarpad-calendar' });

      var curr = new Date(year, month),
          next = new Date(year, month).increment('month', 1),
          prev = new Date(year, month).decrement('month', 1);

      var runningDay = new Date(year,month).get('day') - (this.options.weekStartsOnMonday ? 1 : 0),
          daysInMonth = Date.daysInMonth(month, year),
          daysInThisWeek = 1,
          dayCounter = 0;

      if(runningDay < 0) runningDay = 6;

      new Element('div', {
        'class': 'calendarpad-title',
        'text': Date.getMsg('months')[month] + ' ' + year
      }).inject(calendar);
      
      this.dayNames.each(function(day) {
        new Element('abbr', {
          'class': 'calendarpad-day-title',
          'text': (self.options.weekDayNameLength > 0 ? day.substr(0, self.options.weekDayNameLength) : day),
          'title': day
        }).inject(calendar);
      });

      for (i = runningDay; i > 0; i--) {
        new Element('a', {
          'class': 'calendarpad-day previous-month',
          'text': (Date.daysInMonth(prev) - i + 1).toString().pad(2, '0', 'left'),
          'href': '#' + prev.get('year') + '-' + (prev.get('month') + 1) + '-' + Date.daysInMonth(prev) - i
        }).inject(calendar);
      }

      for(i = 1; i <= daysInMonth; i++) {
        var today = new Date(year, month, i);
        new Element('a', {
          'class': 'calendarpad-day this-month' + (today.diff(self.today) == 0 ? ' today' : '') + (today.diff(self.active) == 0 ? ' active' : ''),
          'text': i.toString().pad(2, '0', 'left'),
          'href': '#' + year + '-' + (month + 1) + '-' + i,
          'events': {
            'click': function(e) {
              e.preventDefault();
              self.pick(this);
            }
          }
        }).inject(calendar);

    		if(runningDay == 6) {
    			runningDay = -1;
    			daysInThisWeek = 0;
    		}

    		daysInThisWeek++;
    		runningDay++;
    		dayCounter++;
    	}

      if(daysInThisWeek > 1) {
    		for(i = 1; i <= (8 - daysInThisWeek); i++) {
    			new Element('a', {
            'class': 'calendarpad-day next-month',
            'text': i.toString().pad(2, '0', 'left'),
            'href': '#' + next.get('year') + '-' + (next.get('month') + 1) + '-' + i
          }).inject(calendar);
    		}
    	}

      return calendar;
    },
    pick: function(element) {
      this.container.getElements('.calendarpad-day.active').removeClass('active');
      element.addClass('active');
      this.active = new Date().parse(element.get('href'));
      this.fireEvent('onSelect', { 'date': this.active });
    }
  });
   
})();