YUI.add('moodle-atto_recordrtc-recordingcommon', function (Y, NAME) {

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

// JSHint directives.
/*jshint es5: true */
/*jshint onevar: false */
/*jshint shadow: true */
/*global M */
/*global tinyMCEPopup */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */
/** global: tinyMCEPopup */

M.atto_recordrtc = M.atto_recordrtc || {};

M.atto_recordrtc.commonmodule = {
    // Unitialized variables to be used by the other modules.
    editorScope: null,
    alertWarning: null,
    alertDanger: null,
    player: null,
    playerDOM: null, // Used to manipulate DOM directly.
    startStopBtn: null,
    uploadBtn: null,
    recType: null,
    stream: null,
    mediaRecorder: null,
    olderMoodle: null,

    // A helper for making a Moodle alert appear.
    // Subject is the content of the alert (which error ther alert is for).
    // Possibility to add on-alert-close event.
    show_alert: function(subject, onCloseEvent) {
        Y.use('moodle-core-notification-alert', function() {
            var dialogue = new M.core.alert({
                title: M.util.get_string(subject + '_title', 'atto_recordrtc'),
                message: M.util.get_string(subject, 'atto_recordrtc')
            });

            if (onCloseEvent) {
                dialogue.after('complete', onCloseEvent);
            }
        });
    },


    // Handle getUserMedia errors.
    handle_gum_errors: function(error, commonConfig) {
        var btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc'),
            treatAsStopped = function() {
                commonConfig.onMediaStopped(btnLabel);
            };

        // Changes 'CertainError' -> 'gumcertain' to match language string names.
        var stringName = 'gum' + error.name.replace('Error', '').toLowerCase();

        // After alert, proceed to treat as stopped recording, or close dialogue.
        if (stringName !== 'gumsecurity') {
            M.tinymce_recordrtc.show_alert(stringName, treatAsStopped);
        } else {
            M.tinymce_recordrtc.show_alert(stringName, function() {
                tinyMCEPopup.close();
            });
        }
    },

    // Select best options for the recording codec and bitrate.
    best_rec_options: function(recType) {
        var types, options;

        if (recType === 'audio') {
            types = [
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus'
            ];

            options = {
                audioBitsPerSecond: cm.editorScope.get('audiobitrate')
            };
        } else {
            types = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=h264,opus',
                'video/webm;codecs=vp8,opus'
            ];

            options = {
                audioBitsPerSecond: cm.editorScope.get('audiobitrate'),
                videoBitsPerSecond: cm.editorScope.get('videobitrate')
            };
        }

        var compatTypes = types.filter(function(type) {
            return window.MediaRecorder.isTypeSupported(type);
        });

        if (compatTypes !== []) {
            options.mimeType = compatTypes[0];
        }

        return options;
    },

    // Notify and redirect user if plugin is used from insecure location.
    check_secure: function() {
        var isSecureOrigin = (window.location.protocol === 'https:') ||
                             (window.location.host.indexOf('localhost') !== -1);

        if (!isSecureOrigin) {
            cm.alertDanger.ancestor().ancestor().removeClass('hide');
        }
    },

    // Display "consider switching browsers" message if not using:
    // - Firefox 29+;
    // - Chrome 49+;
    // - Opera 36+.
    check_browser: function() {
        if (!((window.bowser.firefox && window.bowser.version >= 29) ||
              (window.bowser.chrome && window.bowser.version >= 49) ||
              (window.bowser.opera && window.bowser.version >= 36))) {
            cm.alertWarning.ancestor().ancestor().removeClass('hide');
        }
    },

    // Capture webcam/microphone stream.
    capture_user_media: function(mediaConstraints, successCallback, errorCallback) {
        window.navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
    },

    // Generates link to recorded annotation to be inserted.
    create_annotation: function(type, recording_url) {
        var linkText = window.prompt(M.util.get_string('annotationprompt', 'atto_recordrtc'),
                                     M.util.get_string('annotation:' + type, 'atto_recordrtc'));

        // Return HTML for annotation link, if user did not press "Cancel".
        if (!linkText) {
            return undefined;
        } else {
            var annotation = '<a target="_blank" href="' + recording_url + '">' + linkText + '</a>';
            return annotation;
        }
    },

    // Inserts link to annotation in editor text area.
    insert_annotation: function(type, recording_url) {
        var annotation = cm.create_annotation(type, recording_url);

        // Insert annotation link.
        // If user pressed "Cancel", just go back to main recording screen.
        if (!annotation) {
            cm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        } else {
            cm.editorScope.setLink(cm.editorScope, annotation);
        }
    }
};

// Shorten access to module namespaces.
// THIS MUST BE PUT HERE AT THE END TO WORK, FOR REASONS UNKNOWN.
var cm = M.atto_recordrtc.commonmodule;


}, '@VERSION@', {"requires": ["moodle-atto_recordrtc-button"]});
