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
                M.atto_recordrtc.premiumaudiomodule.stop_recording(cm.stream);

                // Change button to offer to record again.
                cm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!cm.olderMoodle) {
                    cm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });

        // Handle when upload button is clicked.
        cm.uploadBtn.on('click', function() {
            // Trigger error if no recording has been made.
            if (!cm.player.get('src')) {
                cm.show_alert('norecordingfound');
            } else {
                cm.uploadBtn.set('disabled', true);

                hm.socket.emit('recording uploaded');

                cm.insert_annotation(cm.recType, cm.player.get('src'));
            }
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
    },

    stop_recording: function(stream) {
        // Stop recording microphone stream.
        cm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
};
