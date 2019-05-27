// ==UserScript==
// @name         Facebook Volume Saver
// @description  Remember Facebook video volume
// @include      http*://*facebook*/*
// @license      MIT
// @author       Semitalis
// @namespace    https://github.com/Semitalis/
// @version      1.5
// @homepage     https://github.com/Semitalis/facebook-volume-saver
// @downloadURL  https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @updateURL    https://raw.githubusercontent.com/Semitalis/facebook-volume-saver/master/facebook_volume_saver.user.js
// @require      https://code.jquery.com/jquery-3.3.1.min.js#sha256=FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
/*
Changelog:
1.5:
- fixed general issues and added jquery support
1.4:
- fixed issues with multiple instances
1.3:
- use GM_* API for storage
1.2:
- cleaned up code a little
1.1:
- sync volume to other video elements
1.0:
- initial version
*/

var $ = window.jQuery;

// UTILS
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
        return {
            save : function (key, value){
                GM_setValue(key, value);
            },
            load : function (key, def){
                return GM_getValue(key, def);
            }
        };
    }())
};

// MAIN
$(document).ready(function() {
    'use strict';

    // PRIVATE VARIABLES
    var m = {
        debug     : false,
        observer  : null,
        volume    : semi_utils.storage.load('fvs_video_volume', 0.25),
        muted     : semi_utils.storage.load('fvs_video_muted', false),
        unique_id : 0,
        url       : '',
        playing   : false,
        current   : null
    };

    // PRIVATE METHODS
    var f = {
        log : function(s){
            if(m.debug){
                console.log(s);
            }
        },
        on_check : function(){
            $('video').each(function(){
                var video = $(this);

                // add the handlers just once to each new video node
                if(video.attr('fvs_attached') === 'true'){
                    return;
                }
                video.attr('fvs_attached', 'true');

                var id = 'fvs_' + m.unique_id++
                video.attr('fvs_id', id);

                // add handlers
                video.on('play', function(){
                    m.playing = true;
                    if(m.current === id){
                        return;
                    }
                    m.current = id;
                    this.volume = m.volume;
                    this.muted = m.muted;
                    f.log("[FVS] changed active player: '" + m.current + "'");
                });
                video.on('pause', function(){
                    m.playing = false;
                    f.log('[FVS] pause!');
                });
                video.on('volumechange', function(){
                    var v;
                    if(m.current !== id){
                        return;
                    }
                    v = this.volume;
                    if(semi_utils.isNumber(v) && (v !== m.volume)){
                        m.volume = v;
                        semi_utils.storage.save('fvs_video_volume', v);
                        f.log("[FVS] volume changed: " + v);
                    }
                    v = this.muted;
                    if(semi_utils.isBool(v) && (v !== m.muted)){
                        if(m.playing){
                            m.muted = v;
                            semi_utils.storage.save('fvs_video_muted', v);
                            f.log("[FVS] muted changed: " + v);
                        } else {
                            this.muted = m.muted;
                            f.log("[FVS] reinforced previous muted state: " + this.muted);
                        }
                    }
                });
            });
        },
        on_dom_change : function(){
            clearTimeout(m.check_timer);
            m.check_timer = setTimeout(function(){
                m.check_timer = null;
                f.on_check();
              }, 250);
        },
        init : function(){
            // do this just once
            var body = $(document.body)
            if(body.attr('fvs_init') === 'true'){
                return;
            }
            body.attr('fvs_init', 'true');

            // setup observer for new DOM elements
            m.observer = new MutationObserver(function(mutations) {
                mutations.forEach(function() {
                    f.on_dom_change();
                });
            });
            m.observer.observe(document.body, {
                childList  : true,
                attributes : true,
                subtree    : true
            });

            // trigger check for already existing elements
            f.on_dom_change();

            // all setup
            f.log("[FVS] initialized. volume(" + m.volume + "), muted(" + m.muted + ")");
        }
    };

    // actual ready handler as return value
    return f.init;
}());
