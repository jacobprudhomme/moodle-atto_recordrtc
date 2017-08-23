// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
//

/**
 * Atto recordrtc library functions
 *
 * @package    atto_recordrtc
 * @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_recordrtc-button
 */

/**
 * Atto text editor recordrtc plugin.
 *
 * @namespace M.atto_recordrtc
 * @class button
 * @extends M.editor_atto.EditorPlugin
 */

// ESLint directives.
/* eslint-disable camelcase, spaced-comment */

// JSHint directives.
/*global M */
/*jshint onevar: false */

// Scrutinizer CI directives.
/** global: Y */
/** global: M */

var PLUGINNAME = 'atto_recordrtc',
    TEMPLATE = '' +
    '<div class="{{PLUGINNAME}} container-fluid">' +
      '<div class="{{bs_row}} hide">' +
        '<div class="{{bs_col}}12">' +
          '<div id="alert-warning" class="alert {{bs_al_warn}}">' +
            '<strong>{{browseralert_title}}</strong> {{browseralert}}' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="{{bs_row}} hide">' +
        '<div class="{{bs_col}}12">' +
          '<div id="alert-danger" class="alert {{bs_al_dang}}">' +
            '<strong>{{insecurealert_title}}</strong> {{insecurealert}}' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="{{bs_row}} hide">' +
        '{{#if audio}}' +
          '<div class="{{bs_col}}1"></div>' +
          '<div class="{{bs_col}}10">' +
            '<audio id="player"></audio>' +
          '</div>' +
          '<div class="{{bs_col}}1"></div>' +
        '{{else}}' +
          '<div class="{{bs_col}}12">' +
            '<video id="player"></video>' +
          '</div>' +
        '{{/if}}' +
      '</div>' +
      '<div class="{{bs_row}}">' +
        '<div class="{{bs_col}}1"></div>' +
        '<div class="{{bs_col}}10">' +
          '<button id="start-stop" class="{{bs_ss_btn}}">{{startrecording}}</button>' +
        '</div>' +
        '<div class="{{bs_col}}1"></div>' +
      '</div>' +
      '<div class="{{bs_row}} hide">' +
        '<div class="{{bs_col}}3"></div>' +
        '<div class="{{bs_col}}6">' +
          '<button id="upload" class="btn btn-primary btn-block">{{attachrecording}}</button>' +
        '</div>' +
        '<div class="{{bs_col}}3"></div>' +
      '</div>' +
    '</div>';

Y.namespace('M.atto_recordrtc').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
    /**
     * The current language by default.
     */
    _lang: 'en',

    initializer: function() {
        if (this.get('host').canShowFilepicker('media')) {
            // Add audio and/or video buttons depending on the settings.
            var allowedtypes = this.get('allowedtypes');
            if (allowedtypes === 'both' || allowedtypes === 'audio') {
                this._addButton('audio', this._audio);
            }
            if (allowedtypes === 'both' || allowedtypes === 'video') {
                this._addButton('video', this._video);
            }

            // Initialize the dialogue box.
            var dialogue = this.getDialogue({
                width: 1000,
                focusAfterHide: null
            });

            // If dialogue is closed during recording, do the following.
            var editor = this;
            dialogue.after('visibleChange', function() {
                var closed = !dialogue.get('visible'),
                    premium = editor.get('premiumservice') === '1',
                    cm = M.atto_recordrtc.commonmodule,
                    hm = premium ? M.atto_recordrtc.premiumhelpermodule
                                 : M.atto_recordrtc.helpermodule;

                if (closed) {
                    if (premium) {
                        // Disconnect the socket.
                        hm.socket.disconnect(true);
                    } else {
                        // Clear the countdown timer.
                        window.clearInterval(hm.countdownTicker);
                    }

                    if (cm.mediaRecorder && cm.mediaRecorder.state !== 'inactive') {
                        cm.mediaRecorder.stop();
                    }

                    if (cm.stream) {
                        var tracks = cm.stream.getTracks();
                        for (var i = 0; i < tracks.length; i++) {
                            if (tracks[i].readyState !== 'ended') {
                                tracks[i].stop();
                            }
                        }
                    }
                }
            });

            // Require Bowser, adapter.js and Socket.io libraries.
            require(['atto_recordrtc/bowser'], function(bowser) {
                window.bowser = bowser;
            });
            require(['atto_recordrtc/adapter'], function(adapter) {
                window.adapter = adapter;
            });
            require(['atto_recordrtc/socket.io'], function(io) {
                window.io = io;
            });
        }
    },

    /**
     * Add the buttons to the Atto toolbar.
     *
     * @method _addButton
     * @param {string} type Type of button to add.
     * @param {callback} callback Function to be launched on button click.
     * @private
     */
    _addButton: function(type, callback) {
        this.addButton({
            buttonName: type,
            icon: this.get(type + 'rtcicon'),
            iconComponent: PLUGINNAME,
            callback: callback,
            title: type + 'rtc',
            tags: type + 'rtc',
            tagMatchRequiresAll: false
        });
    },

    /**
     * Toggle audiortc and normal display mode
     *
     * @method _audio
     * @private
     */
    _audio: function() {
        var dialogue = this.getDialogue();

        dialogue.set('height', 400);
        dialogue.set('headerContent', M.util.get_string('audiortc', 'atto_recordrtc'));
        dialogue.set('bodyContent', this._createContent('audio'));

        dialogue.show();

        if (this.get('premiumservice') === '1') {
            M.atto_recordrtc.premiumaudiomodule.init(this);
        } else {
            M.atto_recordrtc.audiomodule.init(this);
        }
    },

    /**
     * Toggle videortc and normal display mode
     *
     * @method _video
     * @private
     */
    _video: function() {
        var dialogue = this.getDialogue();

        dialogue.set('height', 850);
        dialogue.set('headerContent', M.util.get_string('videortc', 'atto_recordrtc'));
        dialogue.set('bodyContent', this._createContent('video'));

        dialogue.show();

        if (this.get('premiumservice') === '1') {
            M.atto_recordrtc.premiumvideomodule.init(this);
        } else {
            M.atto_recordrtc.videomodule.init(this);
        }
    },

    /**
     * Create the HTML to be displayed in the dialogue box
     *
     * @method _createContent
     * @param {string} type Type of recording layout to generate.
     * @returns {string} Compiled Handlebars template.
     * @private
     */
    _createContent: function(type) {
        var audio = (type === 'audio'),
            bsRow = this.get('oldermoodle') ? 'row-fluid' : 'row',
            bsCol = this.get('oldermoodle') ? 'span' : 'col-xs-',
            bsAlWarn = this.get('oldermoodle') ? '' : 'alert-warning',
            bsAlDang = this.get('oldermoodle') ? 'alert-error' : 'alert-danger',
            bsSsBtn = this.get('oldermoodle') ? 'btn btn-large btn-danger btn-block'
                                              : 'btn btn-lg btn-outline-danger btn-block';

        var bodyContent = Y.Handlebars.compile(TEMPLATE)({
            PLUGINNAME: PLUGINNAME,
            audio: audio,
            bs_row: bsRow,
            bs_col: bsCol,
            bs_al_warn: bsAlWarn,
            bs_al_dang: bsAlDang,
            bs_ss_btn: bsSsBtn,
            bs_ul_btn: 'btn btn-primary btn-block',
            browseralert_title: M.util.get_string('browseralert_title', 'atto_recordrtc'),
            browseralert: M.util.get_string('browseralert', 'atto_recordrtc'),
            insecurealert_title: M.util.get_string('insecurealert_title', 'atto_recordrtc'),
            insecurealert: M.util.get_string('insecurealert', 'atto_recordrtc'),
            startrecording: M.util.get_string('startrecording', 'atto_recordrtc'),
            attachrecording: M.util.get_string('attachrecording', 'atto_recordrtc')
        });

        return bodyContent;
    },

    /**
     * Close the dialogue without further action.
     *
     * @method closeDialogue
     * @param {object} scope The "this" context of the editor.
     */
    closeDialogue: function(scope) {
        scope.getDialogue().hide();

        scope.editor.focus();
    },

    /**
     * Insert the annotation link in the editor.
     *
     * @method setLink
     * @param {Object} scope The "this" context of the editor.
     * @param {String} annotation The HTML link to the recording.
     */
    setLink: function(scope, annotation) {
        scope.getDialogue().hide();

        scope.editor.focus();
        scope.get('host').insertContentAtFocusPoint(annotation);
        scope.markUpdated();
    }
}, {
    ATTRS: {
        /**
         * The contextid to use when generating this recordrtc.
         *
         * @attribute contextid
         * @type String
         */
        contextid: {
            value: null
        },

        /**
         * The sesskey to use when generating this recordrtc.
         *
         * @attribute sesskey
         * @type String
         */
        sesskey: {
            value: null
        },

        /**
         * The root to use when loading the recordrtc.
         *
         * @attribute recordrtcroot
         * @type String
         */
        recordrtcroot: {
            value: null
        },

        /**
         * The allowedtypes to use when generating this recordrtc.
         *
         * @attribute allowedtypes
         * @type String
         */
        allowedtypes: {
            value: null
        },

        /**
         * The audiobitrate to use when generating this recordrtc.
         *
         * @attribute audiobitrate
         * @type String
         */
        audiobitrate: {
            value: null
        },

        /**
         * The videobitrate to use when generating this recordrtc.
         *
         * @attribute videobitrate
         * @type String
         */
        videobitrate: {
            value: null
        },

        /**
         * The timelimit to use when generating this recordrtc.
         *
         * @attribute timelimit
         * @type String
         */
        timelimit: {
            value: null
        },

        /**
         * Whether or not to use premium recording service.
         *
         * @attribute premiumservice
         * @type Boolean
         */
        premiumservice: {
            value: null
        },

        /**
         * The URL of the premium recording server.
         *
         * @attribute serverurl
         * @type String
         */
        serverurl: {
            value: null
        },

        /**
         * The API key for the premium recording service.
         *
         * @attribute apikey
         * @type String
         */
        apikey: {
            value: null
        },

        /**
         * The API shared secret for the premium recording service.
         *
         * @attribute apisecret
         * @type String
         */
        apisecret: {
            value: null
        },

        /**
         * The audiortcicon to use when generating this recordrtc.
         *
         * @attribute audiortcicon
         * @type String
         */
        audiortcicon: {
            value: null
        },

        /**
         * The videortcicon to use when generating this recordrtc.
         *
         * @attribute videortcicon
         * @type String
         */
        videortcicon: {
            value: null
        },

        /**
         * True if Moodle is version < 3.2.
         *
         * @attribute oldermoodle
         * @type Boolean
         */
        oldermoodle: {
            value: null
        },

        /**
         * Maximum upload size set on server, in MB.
         *
         * @attribute maxrecsize
         * @type String
         */
        maxrecsize: {
            value: null
        }
    }
});
