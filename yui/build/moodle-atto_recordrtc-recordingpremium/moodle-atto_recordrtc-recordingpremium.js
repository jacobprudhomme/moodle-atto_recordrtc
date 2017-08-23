YUI.add('moodle-atto_recordrtc-recordingpremium', function (Y, NAME) {

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

// ESLint directives.
/* eslint-disable camelcase, spaced-comment */

// JSHint directives.
/*global M */
/*jshint onevar: false, shadow: true */

// Scrutinizer CI directives.
/** global: M */

M.atto_recordrtc = M.atto_recordrtc || {};

// Shorten access to module namespaces.
var cm = M.atto_recordrtc.commonmodule,
    hm = M.atto_recordrtc.premiumhelpermodule;

M.atto_recordrtc.premiumhelpermodule = {
    // Unitialized variables to be used by the other modules.
    socket: null,

    // Attempt to connect to the premium server via Socket.io.
    init_connection: function() {
        // Dialogue-closing behaviour.
        var closeDialogue = function() {
            cm.editorScope.closeDialogue(cm.editorScope);
        };

        hm.socket.connect();

        hm.socket.on('connect', function() {
            // Send key and secret from Moodle settings.
            hm.socket.emit('authentication', {
                key: cm.editorScope.get('apikey'),
                secret: cm.editorScope.get('apisecret')
            });

            hm.socket.on('authenticated', function() {
                // Continue as normal.
            });

            hm.socket.on('unauthorized', function() {
                cm.show_alert('notpremium', closeDialogue);
            });
        });

        hm.socket.on('connect_error', function() {
            hm.socket.disconnect();

            cm.show_alert('servernotfound', closeDialogue);
        });
    },

    // Push chunks of audio/video to server when made available.
    handle_data_available: function(event) {
        hm.socket.emit('data available', event.data);
    },

    // Stop recording and handle end.
    handle_stop: function() {
        cm.startStopBtn.set('textContent', 'Start Recording');

        hm.socket.emit('recording stopped');

        hm.socket.on('save finished', function(path) {
            cm.player.set('src', path);
            cm.player.set('controls', true);
            cm.player.set('muted', false);
            cm.player.ancestor().ancestor().removeClass('hide'); // Only audio player is hidden at this point.

            // Show upload button.
            cm.uploadBtn.set('disabled', false);
            cm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
            cm.uploadBtn.ancestor().ancestor().removeClass('hide');
        });
    },

    // Get everything set up to start recording.
    start_recording: function(type, stream) {
        // Generate filename with random ID and file extension.
        var fileName = (Math.random() * 1000).toString().replace('.', '');
        fileName += (type === 'audio') ? '-audio.ogg'
                                       : '-video.webm';

        var data = {
            contextid: cm.editorScope.get('contextid'),
            type: cm.recType,
            itemid: M.cfg.sesskey, // Use session key as item ID.
            filename: fileName
        };
        hm.socket.emit('recording started', data);

        // If none of the mime-types are supported, fall back on browser defaults.
        var options = cm.best_rec_options(type);
        cm.mediaRecorder = new window.MediaRecorder(stream, options);

        hm.socket.on('recording started', function() {
            // Make button clickable again, to allow stopping recording.
            cm.startStopBtn.set('textContent', M.util.get_string('stoprecording', 'atto_recordrtc'));
            cm.startStopBtn.set('disabled', false);

            // Mute audio, distracting while recording.
            cm.player.set('muted', true);

            cm.mediaRecorder.ondataavailable = hm.handle_data_available;
            cm.mediaRecorder.onstop = hm.handle_stop;
            cm.mediaRecorder.start(1500); // Capture in 1.5s chunks.
        });
    }
};
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

// ESLint directives.
/* eslint-disable camelcase */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */

M.atto_recordrtc = M.atto_recordrtc || {};

var cm = null,
    hm = null;

M.atto_recordrtc.premiumaudiomodule = {
    init: function(scope) {
        // Shorten access to module namespaces.
        cm = M.atto_recordrtc.commonmodule;
        hm = M.atto_recordrtc.premiumhelpermodule;

        // Assignment of global variables.
        cm.editorScope = scope; // Allows access to the editor's "this" context.
        cm.alertWarning = Y.one('div#alert-warning');
        cm.alertDanger = Y.one('div#alert-danger');
        cm.player = Y.one('audio#player');
        cm.playerDOM = document.querySelector('audio#player');
        cm.startStopBtn = Y.one('button#start-stop');
        cm.uploadBtn = Y.one('button#upload');
        cm.recType = 'audio';
        cm.olderMoodle = scope.get('oldermoodle');
        hm.socket = window.io(cm.editorScope.get('serverurl'));

        // Show alert and close plugin if WebRTC is not supported.
        cm.check_has_gum();
        // Show alert and redirect user if connection is not secure.
        cm.check_secure();
        // Show alert if using non-ideal browser.
        cm.check_browser();

        // Connect to premium recording server.
        hm.init_connection();

        // Run when user clicks on "record" button.
        cm.startStopBtn.on('click', function() {
            cm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((cm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the audio player and upload button are not shown.
                cm.player.ancestor().ancestor().addClass('hide');
                cm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make audio stream available at a higher level by making it a property of the common module.
                        cm.stream = stream;

                        hm.start_recording(cm.recType, cm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        cm.startStopBtn.set('textContent', btnLabel);
                        cm.startStopBtn.set('disabled', false);
                        if (!cm.olderMoodle) {
                            cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        cm.handle_gum_errors(error, commonConfig);
                    }
                };

                // Capture audio stream from microphone.
                M.atto_recordrtc.premiumaudiomodule.capture_audio(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    cm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                cm.stop_recording(cm.stream);

                // Change button to offer to record again.
                cm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });

        // Handle when upload button is clicked.
        cm.uploadBtn.on('click', function() {
            // Currently no way to check if no recording has been made.
            cm.uploadBtn.set('disabled', true);

            hm.socket.emit('recording uploaded');

            cm.insert_annotation(cm.recType, cm.player.get('src'));
        });
    },

    // Setup to get audio stream from microphone.
    capture_audio: function(config) {
        cm.capture_user_media(
            // Media constraints.
            {
                audio: true
            },

            // Success callback.
            function(audioStream) {
                // Set audio player source to microphone stream.
                cm.playerDOM.srcObject = audioStream;

                config.onMediaCaptured(audioStream);
            },

            // Error callback.
            function(error) {
                config.onMediaCapturingFailed(error);
            }
        );
    }
};
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

// ESLint directives.
/* eslint-disable camelcase */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */

M.atto_recordrtc = M.atto_recordrtc || {};

var cm = null,
    hm = null;

M.atto_recordrtc.premiumvideomodule = {
    init: function(scope) {
        // Shorten access to module namespaces.
        cm = M.atto_recordrtc.commonmodule;
        hm = M.atto_recordrtc.premiumhelpermodule;

        // Assignment of global variables.
        cm.editorScope = scope; // Allows access to the editor's "this" context.
        cm.alertWarning = Y.one('div#alert-warning');
        cm.alertDanger = Y.one('div#alert-danger');
        cm.player = Y.one('video#player');
        cm.playerDOM = document.querySelector('video#player');
        cm.startStopBtn = Y.one('button#start-stop');
        cm.uploadBtn = Y.one('button#upload');
        cm.recType = 'video';
        cm.olderMoodle = scope.get('oldermoodle');
        hm.socket = window.io(cm.editorScope.get('serverurl'));

        // Show alert and close plugin if WebRTC is not supported.
        cm.check_has_gum();
        // Show alert and redirect user if connection is not secure.
        cm.check_secure();
        // Show alert if using non-ideal browser.
        cm.check_browser();

        // Connect to premium recording server.
        hm.init_connection();

        // Run when user clicks on "record" button.
        cm.startStopBtn.on('click', function() {
            cm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((cm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (cm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the upload button is not shown.
                cm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make video stream available at a higher level by making it a property of the common module.
                        cm.stream = stream;

                        hm.start_recording(cm.recType, cm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        cm.startStopBtn.set('textContent', btnLabel);
                        cm.startStopBtn.set('disabled', false);
                        if (!cm.olderMoodle) {
                            cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        cm.handle_gum_errors(error, commonConfig);
                    }
                };

                // Show video tag without controls to view webcam stream.
                cm.player.ancestor().ancestor().removeClass('hide');
                cm.player.set('controls', false);

                // Capture audio+video stream from webcam/microphone.
                M.atto_recordrtc.premiumvideomodule.capture_audio_video(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    cm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                cm.stop_recording(cm.stream);

                // Change button to offer to record again.
                cm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });

        // Handle when upload button is clicked.
        cm.uploadBtn.on('click', function() {
            // Currently no way to check if no recording has been made.
            cm.uploadBtn.set('disabled', true);

            hm.socket.emit('recording uploaded');

            cm.insert_annotation(cm.recType, cm.player.get('src'));
        });
    },

    // Setup to get audio+video stream from microphone/webcam.
    capture_audio_video: function(config) {
        cm.capture_user_media(
            // Media constraints.
            {
                audio: true,
                video: {
                    width: {ideal: 640},
                    height: {ideal: 480}
                }
            },

            // Success callback.
            function(audioVideoStream) {
                // Set video player source to microphone+webcam stream, and play it back as it's recording.
                cm.playerDOM.srcObject = audioVideoStream;
                cm.playerDOM.play();

                config.onMediaCaptured(audioVideoStream);
            },

            // Error callback.
            function(error) {
                config.onMediaCapturingFailed(error);
            }
        );
    }
};


}, '@VERSION@', {"requires": ["moodle-atto_recordrtc-button", "moodle-atto_recordrtc-recordingcommon"]});
