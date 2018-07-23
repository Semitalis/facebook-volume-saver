// ==UserScript==
// @name         Facebook Volume Saver
// @description  Remember Facebook video volume
// @match        https://www.facebook.com/*
// @license      MIT
// @author       Semitalis
// @namespace    https://github.com/Semitalis/
// @version      1.0
// @homepage     https://github.com/Semitalis/facebook-volume-saver
// @downloadURL	 https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @updateURL    https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // UTIL FUNCS
    function isNumber(v) {
        return !isNaN(parseFloat(v)) && !isNaN(v - 0);
    }

    function storage_save(key, value){
        localStorage[key] = value;
    }

    function storage_load(key, def){
        return localStorage[key] || def;
    }

    // PRIVATE VARIABLES
    var m = {
        observer : null,
        volume   : storage_load('semi_video_volume', 0.25)
    };

    // PRIVATE METHODS
    var f = {
        check : function(nodes){
            var node;
            for(node of nodes){
                if(node.nodeName === 'VIDEO'){
                    node.addEventListener('canplay', function(){
                        this.volume = m.volume;
                    });
                    node.addEventListener('volumechange', function(){
                        var v = this.volume;
                        if(isNumber(v) && (v !== m.volume)){
                            m.volume = v;
                            //console.log('volume changed: ' + this.volume);
                            storage_save('semi_video_volume', this.volume);
                        }
                    });
                }
                f.check(node.childNodes);
            }
        },
        init : function(){
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
    f.init();
})();
