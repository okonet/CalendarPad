/* 
  calendar.js

  Implements calendar block with 3 months and an ability to switch months.

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
  
  window.Calendar = new Class({

    Implements: [Options, Events],

    options: {
      /*
      'onBuild': $empty,
      'onSelect': $empty,
      */
      'z-index': 1,
      'prefix': 'calendar-',
      'months': 3,
      'weekStartsOnMonday': true, // Use false for Sunday,
      'weekDayNameLength': 3, // 1 for "M", 3 for "Mon", -1 for "Monday"
      'disablePrevNextMonth': true,
      'selectedDate': ''
    },

    initialize: function(element, options) {
      this.setOptions(options);
      this.container = $(element);

      var now = new Date(),
          selected = this.options.selectedDate ? new Date().parse(this.options.selectedDate) : null,
          today = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();

      if(selected) {
        var active = selected.getFullYear() + '-' + selected.getMonth() + '-' + selected.getDate();
        var month = selected.getMonth();
        var year = selected.getFullYear();
      } else {
        var month = now.getMonth();
        var year = now.getFullYear();
      }

      this.today = today;
      this.now = now;
      this.active = active;
      this.active_month = month;
      this.active_year = year;
      // this.siblings = this.sibling_months(this.active_year, this.active_month);

      this.build(year, month);

      this.container.addEvents({
        'click:relay(.datepicker-previous)': function(e){
          e.preventDefault();

          var siblings = this.sibling_months(this.active_year, this.active_month);
          this.active_month  = siblings.previous_month;
          this.active_year   = siblings.previous_year;

          this.months.addClass('slide-right');
          var new_cals = this.renderCalenders(this.active_year, this.active_month).addClass('slide-left');
          this.wrap.grab(new_cals);
          (function(){ new_cals.removeClass('slide-left'); }).delay(1);

          this.fireEvent('onPrevious', [e, this.active_year, this.active_month]);

        }.bindWithEvent(this),

        'click:relay(.datepicker-next)': function(e){
          e.preventDefault();

          var siblings = this.sibling_months(this.active_year, this.active_month);
          this.active_month  = siblings.next_month;
          this.active_year   = siblings.next_year;

          this.months.addClass('slide-left');
          var new_cals = this.renderCalenders(this.active_year, this.active_month).addClass('slide-right');
          this.wrap.grab(new_cals);
          (function(){ new_cals.removeClass('slide-right'); }).delay(1);

          this.fireEvent('onNext', [e, this.active_year, this.active_month]);

        }.bindWithEvent(this)
      });

      ['webkitTransitionEnd', 'mozTransitionEnd', 'oAnimationFinish'].each(function(eventName){
        this.container.addEventListener(eventName, function(e){
          if(e.target.hasClass('slide-right') || e.target.hasClass('slide-left')) e.target.destroy();
        }, false);
      }.bind(this));
    },

    leap_year: function(year) {
      return (!(year % 4) && (year % 100) && !(year % 400));      
    },
    days_in_month: function(year, month) {
      return [31, (this.leap_year(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];     
    },
    month_name: function(month) {
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];  
    },
    sibling_months: function(year, month){
      if (month == 0) {
        var previous_year = (year - 1),
            previous_month = 11,
            days_in_previous_month = this.days_in_month(previous_year, previous_month);
      } else {
        var previous_year = year,
            previous_month = (month - 1),
            days_in_previous_month = this.days_in_month(previous_year, previous_month);
      }

      if (month == 11) {
        var next_month = 0,
            next_year = (year + 1);
      } else {
        var next_month = (month + 1),
            next_year = year;
      }

      return {
        'next_year': next_year,
        'next_month': next_month,
        'previous_year': previous_year,
        'previous_month': previous_month,
        'days_in_previous_month': days_in_previous_month
      };
    },
    build: function(year, month){
      this.container.empty();

      var siblings = this.sibling_months(year, month),
          next_month = siblings.next_month,
          next_year = siblings.next_year,
          previous_month = siblings.previous_month,
          previous_year = siblings.previous_year;

      var controls = new Element('div', { 'class': 'datepicker-controls' });

      var previous = new Element('a', {
        'class': 'datepicker-control datepicker-previous',
        'html': '&laquo;',
        'href': '#'
      }).inject(controls);

      var next = new Element('a', {
        'class': 'datepicker-control datepicker-next',
        'html': '&raquo;',
        'href': '#'
      }).inject(controls);

      this.wrap = new Element('div', { 'class': 'datepicker-wrapper' }).grab(this.renderCalenders(year, month));
      this.container.adopt(controls, this.wrap);

      this.fireEvent('onBuild');
    },
    renderCalenders: function(year, month){
      var siblings = this.sibling_months(year, month),
          next_month = siblings.next_month,
          next_year = siblings.next_year,
          previous_month = siblings.previous_month,
          previous_year = siblings.previous_year;

      var cal1 = this.renderMonth(previous_year, previous_month);
      var cal2 = this.renderMonth(year, month);
      var cal3 = this.renderMonth(next_year, next_month);

      this.months = new Element('div', { 'class': 'datepicker-months' }).adopt(cal1, cal2, cal3);

      return this.months;
    },
    renderMonth: function(year, month) {
      var self = this,
          now = self.now,
          calendar = new Element('div', {
            'class': 'datepicker-calendar'
          });

      now.set('year', year).set('month', month).set('date', 1);

      var siblings = this.sibling_months(year, month),
          next_month = siblings.next_month,
          next_year = siblings.next_year,
          previous_month = siblings.previous_month,
          previous_year = siblings.previous_year;
          days_in_previous_month = siblings.days_in_previous_month;

      var running_day = now.getDay() - (this.options.weekStartsOnMonday ? 1 : 0),
          days_in_month = self.days_in_month(year, month),
          days_in_this_week = 1,
          day_counter = 0;

      if(running_day < 0) running_day = 6;

      var title = new Element('div', {
        'class': 'datepicker-title',
        'text': self.month_name(month) + ' ' + year
      }).inject(calendar);

      (this.options.weekStartsOnMonday ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).each(function(day) {
        new Element('abbr', {
          'class': 'datepicker-day-title',
          'text': (self.options.weekDayNameLength > 0 ? day.substr(0, self.options.weekDayNameLength) : day),
          'title': day
        }).inject(calendar);
      });

      for (i = running_day; i > 0; i--) {
        new Element('a', {
          'class': 'datepicker-day previous-month',
          'text': (days_in_previous_month - i + 1).toString().pad(2, '0', 'left'),
          'href': '#',
          'data-year': previous_year,
          'data-month': previous_month,
          'data-day': (days_in_previous_month - i),
          'events': {
            'click': function(e) {
              e.preventDefault();
              if(!self.options.disablePrevNextMonth)
                self.pick(this);
            }
          }
        }).inject(calendar);
      }

      for(i = 1; i <= days_in_month; i++) {
        var today = year + '-' + month + '-' + i;
        new Element('a', {
          'class': 'datepicker-day this-month' + (today == self.today ? ' today' : '') + (today == self.active ? ' active' : ''),
          'text': i.toString().pad(2, '0', 'left'),
          'href': '#',
          'data-year': year,
          'data-month': month,
          'data-day': i,
          'events': {
            'click': function(e) {
              e.preventDefault();
              self.pick(this);
            }
          }
        }).inject(calendar);

    		if(running_day == 6) {
    			running_day = -1;
    			days_in_this_week = 0;
    		}

    		days_in_this_week++;
    		running_day++;
    		day_counter++;
    	}

      if(days_in_this_week > 1) {
    		for(i = 1; i <= (8 - days_in_this_week); i++) {
    			new Element('a', {
            'class': 'datepicker-day next-month',
            'text': i.toString().pad(2, '0', 'left'),
            'href': '#',
            'data-year': next_year,
            'data-month': next_month,
            'data-day': i,
            'events': {
              click: function(e) {
                e.preventDefault();
                if(!self.options.disablePrevNextMonth)
                  self.pick(this);
              }
            }
          }).inject(calendar);
    		}
    	}

      return calendar;
    },
    pick: function(element) {
      this.container.getElements('.datepicker-day').removeClass('active');

      element.addClass('active');

      this.year = parseInt(element.get('data-year'), 10);
      this.month = parseInt((parseInt(element.get('data-month'), 10) + 1), 10);
      this.day = parseInt(element.get('data-day'), 10);

      this.active_date = new Date().set('year', this.year).set('month', this.month).set('date', this.day);
      this.active = this.year + '-' + (this.month - 1) + '-' + this.day;

      this.fireEvent('onSelect', {'year': this.year, 'month': this.month.toString().pad(2, '0', 'left'), 'day': this.day.toString().pad(2, '0', 'left'), 'date': this.active_date});
    }
  });
   
})();