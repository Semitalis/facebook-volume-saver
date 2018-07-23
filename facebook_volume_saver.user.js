// ==UserScript==
// @name         Facebook Volume Saver
// @description  Remember Facebook video volume
// @match        https://www.facebook.com/*
// @license      MIT
// @author       Semitalis
// @namespace    https://github.com/Semitalis/
// @version      1.1
// @homepage     https://github.com/Semitalis/facebook-volume-saver
// @downloadURL	 https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @updateURL    https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @grant        none
// ==/UserScript==
/*
Changelog:
1.1:
- sync volume to other video elements
1.0:
- initial version
*/

// UTIL FUNCS
function isNumber(v) {
    return !isNaN(parseFloat(v)) && !isNaN(v - 0);
}

function isFloat(v) {
    return (v === +v) && (v !== (v|0));
}

function isInteger(v) {
    return (v === +v) && (v === (v|0));
}

function isBool(v){
    return typeof v === 'boolean';
}

function storage_save(key, value){
    localStorage[key] = value;
}

function storage_load(key, def){
    var v = localStorage[key];
    if(!v){
        return def;
    }
    if(isFloat(def)){
        try{ v = parseFloat(v); } catch(e){ return def; }
    }
    if(isInteger(def)){
        try{ v = parseInt(v); } catch(e){ return def; }
    }
    if(isBool(def)){
        return v === "true";
    }
    return v;
}

// MAIN
(function() {
    'use strict';

    // PRIVATE VARIABLES
    var m = {
        observer : null,
        volume   : storage_load('semi_video_volume', 0.25),
        muted    : storage_load('semi_video_muted', false),
        current  : null
    };

    // PRIVATE METHODS
    var f = {
        check : function(nodes){
            var node;
            for(node of nodes){
                if(node.nodeName === 'VIDEO'){
                    //node.addEventListener('canplay', function(){
                    //    this.volume = m.volume;
                    //    this.semi_init = true;
                    //});
                    node.addEventListener('play', function(){
                        if(m.current === this){
                            return;
                        }
                        this.volume = m.volume;
                        this.muted = m.muted;
                        m.current = this;
                        //console.log('changed player: ' + m.current.id);
                    });
                    node.addEventListener('volumechange', function(){
                        var v;
                        if(m.current != this){
                            return;
                        }
                        v = this.volume;
                        if(isNumber(v) && (v !== m.volume)){
                            m.volume = v;
                            //console.log('volume changed: ' + this.volume);
                            storage_save('semi_video_volume', this.volume);
                        }
                        v = this.muted;
                        if(isBool(v) && (v !== m.muted)){
                            m.muted = v;
                            //console.log('muted changed: ' + this.muted);
                            storage_save('semi_video_muted', this.muted);
                        }
                    });
                }
                f.check(node.childNodes);
            }
        },
        init : function(){
            //console.log("[FVS] initialized. volume(" + m.volume + "), muted(" + m.muted + ")");

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
