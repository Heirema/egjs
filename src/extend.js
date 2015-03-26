"use strict";
(function($, global) {
	/**
	 * @namespace eg
	 */
	var ua, agent,
		checkDefaults = function(method) {
			var v = null;
			if(typeof eg.defaults[method] === "function") {
				v = eg.defaults[method](agent);
			}
			return v;
		};

	global.eg = {
		/**
		 * @name eg.VERSION
		 * @description version infomation
	       */
		VERSION : "#__VERSION__#",
		defaults : {},
		_init : function(useragent) {
			ua = useragent || navigator.userAgent;

			/**
			 * Agent
			 * @method eg#agent
			 * @return {Object} agent
			 * @return {String} agent.os os infomation
			 * @return {String} agent.os.name os name (android, ios, window, mac)
			 * @return {String} agent.os.name os version
			 * @return {String} agent.browser browser information
			 * @return {String} agent.browser.name browser name (default, safari, chrome, sbrowser, ie, firefox)
			 * @return {String} agent.browser.version browser version
			 * @return {String} agent.browser browser type
			 * @return {String} agent.browserVersion browser version
			 */
			agent = (function() {
				var osMatch = /(iPhone |iPad )?OS ([\d|_]+)/.exec(ua) ||
						/(Android) ([\w.]+)/.exec(ua) ||
						/(Windows NT) ([\d|\.]+)/.exec(ua) ||
						/(Windows Phone) ([\d|\.]+)/.exec(ua) ||
						/(Windows) ([\w|\.]+)/.exec(ua) ||
						/(Mac OS X) ([\w.]+)/.exec(ua) ||
						[],
					browserMatch = /(Chrome|CriOS)[ \/]([\w.]+)/.exec(ua) ||
						/(MSIE|Trident)[\/\s]([\d.]+)/.exec(ua) ||
						/(Firefox)\/([\w.]+)/.exec(ua) ||
						[];
				if(osMatch.length >= 3) {
					if(/iPhone|iPad/.test(ua)) {
						osMatch[1] = "ios";
					} else if(/Win/.test(ua)) {
						osMatch[1] = "window";
					} else if(/Mac/.test(ua)) {
						osMatch[1] = "mac";
					} else {
						osMatch[1] = osMatch[1].toLowerCase();
					}
					// in case of window 2000
					if( /Win/.test(ua) && osMatch[2] === "2000" ) {
						osMatch[2] = "5.0";
					}
					osMatch[2] = osMatch[2].replace(/\_/g,".").replace(/\s/g, "");
				}
				if(browserMatch.length >= 3) {
					// console.error(browserMatch[0], "---",  browserMatch[1], "---",  browserMatch[2]  );
					if(/Chrome|CriOS/.test(ua)) {
						browserMatch[1] = /SAMSUNG/.test(ua) ? "sbrowser" : "chrome";
					} else if(/MSIE|Trident/.test(ua)) {
						browserMatch[1] = "ie";
					} else {
						browserMatch[1] = browserMatch[1].toLowerCase();
					}
				}
				if(browserMatch.length === 0) {
					if(osMatch[1] && osMatch[1] !== "android" ) {
						browserMatch = /(Safari)\/([\w.]+)/.exec(ua) || [];
						browserMatch[1] = browserMatch[1].toLowerCase();
						if(/safari/.test(browserMatch[1]) ) {
							// console.warn(browserMatch[0], "---",  browserMatch[1], "---",  browserMatch[2] , /Apple/.test(ua), ua);
							if(/Apple/.test(ua)) {
								browserMatch[2] = ua.match(/Version\/([\d.]+)/)[1];
							} else {
								browserMatch[2] = null;
							}
						}
					}
				}
				return {
					os: {
						name : osMatch[1] || "",
						version: osMatch[2] || "0"
					},
					browser : {
						name : browserMatch[1] || "default",
						version : browserMatch[2] || osMatch[2] || "0"
					}
				};
			})();
			this.agent = agent;
		},
		// __checkLibrary__ : function(condition, message) {
		// 	if(condition) {
		// 		throw {
		// 			message : message,
		// 			type : "[Evergreen]",
		// 			toString : function() {
		// 				return this.type + " " +this.message;
		// 			}
		// 		};
		// 	}
		// },
		/**
		 * get a translate string.
		 *
		 * @method eg#translate
		 * @param {String} x
		 * @param {String} y
		 * @param {Boolean} [isHA]
		 * @return {String}
		 * @example
eg.translate('10px', '200%');  // translate(10px,200%)
eg.translate('10px', '200%', true);  // translate3d(10px,200%,0)
		 */
		translate : function(x,y, isHA) {
			isHA = isHA || false;
			return "translate" + (isHA ? "3d(" : "(") + x + "," + y + (isHA ? ",0)" : ")");
		},
		/**
		 * if your device could use a hardware acceleration, this method returns "true"
		 *
		 * @method eg#isHardwareAccelerable
		 * @param {Function} [interrupt function]
		 * @return {Boolean}
		 * @example
eg.isHardwareAccelerable();  // if your device could use a hardware acceleration, this method returns "true".

// you can control return value
eg.defaults.isHardwareAccelerable = function(agent) {
	if(agent.os.name === "ios") {
		// if os is 'ios', return value is 'false'
		return false;
	} else if(agent.browser.name === "chrome" ) {
		// if browser is 'chrome', return value is 'true'
		return true;
	} else {
		// defer to a return value of the isHardwareAccelerable method.
		return null; 	// or return;
	}
}
		 */
		isHardwareAccelerable : function() {
			var check = checkDefaults("isHardwareAccelerable");
			if( check != null ) {
				return check;
			} else {
				var result = false,
					osVersion = agent.os.version,
					browser = agent.browser.name,
					browserVersion = agent.browser.version;

				// chrome (less then 25) has a text blur bug.
				// but samsung sbrowser fix it.
				if(/chrome/.test(browser)) {
					if(browserVersion >= "25") {
						result = true;
					}
				} else if(/ie|firefox|safari/.test(browser)) {
					result = true;
				} else if(/android/.test(agent.os.name)) {
					var useragent = ua.match(/\(.*\)/);
					if(useragent instanceof Array && useragent.length > 0){
						useragent=useragent[0];
					}
					// android 4.1+ blacklist
					// EK-GN120 : Galaxy Camera, SM-G386F : Galaxy Core LTE
					result = (osVersion >= "4.1.0" && !/EK-GN120|SM-G386F/.test(useragent)) ||
						// SHW-M420 : Galaxy Nexus , SHW-M200 : NexusS , GT-S7562 : Galaxy S duos
						(osVersion >= "4.0.3" &&
							/SHW-|SHV-|GT-|SCH-|SGH-|SPH-|LG-F160|LG-F100|LG-F180|LG-F200|EK-|IM-A|LG-F240|LG-F260/.test(useragent) &&
							!/SHW-M420|SHW-M200|GT-S7562/.test(useragent));
				}
				return result;
			}
		}
	};

	/**
	 * @name eg.DIRECTION_NONE
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_NONE = 1;
	/**
	 * @name eg.DIRECTION_LEFT
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_LEFT = 2;
	/**
	 * @name eg.DIRECTION_RIGHT
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_RIGHT = 4;
	/**
	 * @name eg.DIRECTION_UP
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_UP = 8;
	/**
	 * @name eg.DIRECTION_DOWN
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_DOWN = 16;
	/**
	 * @name eg.DIRECTION_HORIZONTAL
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_HORIZONTAL = global.eg.DIRECTION_LEFT | global.eg.DIRECTION_RIGHT;
	/**
	 * @name eg.DIRECTION_VERTICAL
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_VERTICAL = global.eg.DIRECTION_UP | global.eg.DIRECTION_DOWN;
	/**
	 * @name eg.DIRECTION_ALL
	 * @constant
    	 * @type {Number}
       */
	global.eg.DIRECTION_ALL = global.eg.DIRECTION_HORIZONTAL | global.eg.DIRECTION_VERTICAL;

	global.eg._init();
})(jQuery, window);