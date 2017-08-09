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

// Scrutinizer CI directives.
/** global: M */
/** global: Y */

M.atto_recordrtc = M.atto_recordrtc || {};

// Shorten access to M.atto_recordrtc.commonmodule namespace.
var pcm = M.atto_recordrtc.premiumcommonmodule;

M.atto_recordrtc.premiumcommonmodule = {
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
    socket: null,

    // Notify and redirect user if plugin is used from insecure location.
    check_secure: function() {
        var isSecureOrigin = (window.location.protocol === 'https:') ||
                             (window.location.host.indexOf('localhost') !== -1);

        if (!isSecureOrigin) {
            pcm.alertDanger.ancestor().ancestor().removeClass('hide');
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
            pcm.alertWarning.ancestor().ancestor().removeClass('hide');
        }
    },

    // Attempt to connect to the premium server via Socket.io.
    init_connection: function() {
        pcm.socket.connect();

        pcm.socket.on('connect', function() {
            // Send key and secret from Moodle settings
            pcm.socket.emit('authentication', {
                key: pcm.editorScope.get('apikey'),
                secret: pcm.editorScope.get('apisecret')
            });

            pcm.socket.on('authenticated', function() {
                // Continue as normal.
            });

            pcm.socket.on('unauthorized', function(err) {
                pcm.editorScope.closeDialogue(pcm.editorScope);
                Y.use('moodle-core-notification-alert', function() {
                    new M.core.alert({
                        title: M.util.get_string('notpremium_title', 'atto_recordrtc'),
                        message: M.util.get_string('notpremium', 'atto_recordrtc')
                    });
                });
            });
        });

        pcm.socket.on('connect_error', function() {
            pcm.editorScope.closeDialogue(pcm.editorScope);
            Y.use('moodle-core-notification-alert', function() {
                new M.core.alert({
                    title: M.util.get_string('servernotfound_title', 'atto_recordrtc'),
                    message: M.util.get_string('servernotfound', 'atto_recordrtc')
                });
            });
        });
    },

    // Capture webcam/microphone stream.
    capture_user_media: function(mediaConstraints, successCallback, errorCallback) {
        window.navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
    },

    // Push chunks of audio/video to server when made available.
    handle_data_available: function(event) {
        pcm.socket.emit('data available', event.data);
    },

    // Stop recording and handle end.
    handle_stop: function(event) {
        pcm.startStopBtn.set('textContent', 'Start Recording');

        pcm.socket.emit('recording stopped');

        pcm.socket.on('save finished', function(path) {
            pcm.player.set('src', path);
            pcm.player.set('controls', true);
            pcm.player.set('muted', false);
            pcm.player.ancestor().ancestor().removeClass('hide'); // AUDIO ONLY
        });
    },

    // Get everything set up to start recording.
    start_recording: function(type, stream) {
        // Generate filename with random ID and file extension.
        var fileName = (Math.random() * 1000).toString().replace('.', '');
        if (type === 'audio') {
            fileName += '-audio.ogg';
        } else {
            fileName += '-video.webm';
        }

        var data = {
            contextid: pcm.editorScope.get('contextid'),
            type: pcm.recType,
            itemid: pcm.editorScope.get('sesskey'), // Use session key as item ID.
            filename: fileName
        };
        pcm.socket.emit('recording started', data);

        // The options for the recording codecs and bitrates.
        var options = null;
        if (type === 'audio') {
            if (window.MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    mimeType: 'audio/webm;codecs=opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    mimeType: 'audio/ogg;codecs=opus'
                };
            }
        } else {
            if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: pcm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=vp9,opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: pcm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=h264,opus'
                };
            } else if (window.MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                options = {
                    audioBitsPerSecond: pcm.editorScope.get('audiobitrate'),
                    videoBitsPerSecond: pcm.editorScope.get('videobitrate'),
                    mimeType: 'video/webm;codecs=vp8,opus'
                };
            }
        }

        // If none of the options above are supported, fall back on browser defaults.
        pcm.mediaRecorder = options ? new window.MediaRecorder(stream, options)
                                    : new window.MediaRecorder(stream);

        pcm.socket.on('recording started', function() {
            // Make button clickable again, to allow stopping recording.
            pcm.startStopBtn.set('textContent', M.util.get_string('stoprecording', 'atto_recordrtc'));
            pcm.startStopBtn.set('disabled', false);

            // Mute audio, distracting while recording.
            pcm.player.set('muted', true);

            pcm.mediaRecorder.ondataavailable = pcm.handle_data_available;
            pcm.mediaRecorder.onstop = pcm.handle_stop;
            pcm.mediaRecorder.start(1500); // Capture in 1.5s chunks.
        });
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
        var annotation = pcm.create_annotation(type, recording_url);

        // Insert annotation link.
        // If user pressed "Cancel", just go back to main recording screen.
        if (!annotation) {
            pcm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        } else {
            pcm.editorScope.setLink(pcm.editorScope, annotation);
        }
    }
};
