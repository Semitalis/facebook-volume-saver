// ==UserScript==
// @name         Facebook Volume Saver
// @description  Remember Facebook video volume
// @match        https://www.facebook.com/*
// @license      MIT
// @author       Semitalis
// @namespace    https://github.com/Semitalis/
// @version      1.2
// @homepage     https://github.com/Semitalis/facebook-volume-saver
// @downloadURL	 https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @updateURL    https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @grant        none
// ==/UserScript==
/*
Changelog:
1.2:
- cleaned up code a little
1.1:
- sync volume to other video elements
1.0:
- initial version
*/

// UTIL FUNCS
var semi_utils = {
    isNumber : function(v) {
        return !isNaN(parseFloat(v)) && !isNaN(v - 0);
    },
    isFloat : function (v) {
        return (v === +v) && (v !== (v|0));
    },
    isInteger : function (v) {
        return (v === +v) && (v === (v|0));
    },
    isBool : function (v){
        return typeof v === 'boolean';
    },
    storage : (function(){
        var storage = localStorage;
        return {
            save : function (key, value){
                storage[key] = value;
            },
            load : function (key, def){
                var v = storage[key];
                if(!v){
                    return def;
                }
                if(semi_utils.isFloat(def)){
                    try{ v = parseFloat(v); } catch(e){ return def; }
                }
                if(semi_utils.isInteger(def)){
                    try{ v = parseInt(v); } catch(e){ return def; }
                }
                if(semi_utils.isBool(def)){
                    return v === "true";
                }
                return v;
            }
        };
    }())
};

// MAIN
(function() {
    'use strict';

    // PRIVATE VARIABLES
    var m = {
        debug    : true,
        observer : null,
        volume   : semi_utils.storage.load('semi_video_volume', 0.25),
        muted    : semi_utils.storage.load('semi_video_muted', false),
        current  : null
    };

    // PRIVATE METHODS
    var f = {
        log : function(s){
            if(m.debug){
                console.log(s);
            }
        },
        check : function(nodes){
            var node;
            for(node of nodes){
                if(node.nodeName === 'VIDEO'){
                    if(node.semi_init === true){
                        return;
                    }
                    node.semi_init = true;
                    node.addEventListener('play', function(){
                        if(m.current === this){
                            return;
                        }
                        this.volume = m.volume;
                        this.muted = m.muted;
                        m.current = this;
                        f.log("[FVS] changed active player: '" + m.current.id + "'");
                    });
                    node.addEventListener('volumechange', function(){
                        var v;
                        if(m.current != this){
                            return;
                        }
                        v = this.volume;
                        if(semi_utils.isNumber(v) && (v !== m.volume)){
                            m.volume = v;
                            f.log("[FVS] volume changed: " + this.volume);
                            semi_utils.storage.save('semi_video_volume', this.volume);
                        }
                        v = this.muted;
                        if(semi_utils.isBool(v) && (v !== m.muted)){
                            m.muted = v;
                            f.log("[FVS] muted changed: " + this.muted);
                            semi_utils.storage.save('semi_video_muted', this.muted);
                        }
                    });
                }
                f.check(node.childNodes);
            }
        },
        init : function(){
            f.log("[FVS] initialized. volume(" + m.volume + "), muted(" + m.muted + ")");

            // setup observer for new DOM elements
            m.observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    f.check(mutation.addedNodes);
                });
            });
            m.observer.observe(document.body, { childList: true, subtree: true });

            // check already existing DOM elements
            f.check(document.body.childNodes);
        }
    };

    // initialize framework
    window.addEventListener('load', f.init);
})();
