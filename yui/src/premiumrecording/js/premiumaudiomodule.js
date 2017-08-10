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

M.atto_recordrtc.premiumaudiomodule = {
    init: function(scope) {
        // Assignment of global variables.
        pcm.editorScope = scope; // Allows access to the editor's "this" context.
        pcm.alertWarning = Y.one('div#alert-warning');
        pcm.alertDanger = Y.one('div#alert-danger');
        pcm.player = Y.one('audio#player');
        pcm.playerDOM = document.querySelector('audio#player');
        pcm.startStopBtn = Y.one('button#start-stop');
        pcm.uploadBtn = Y.one('button#upload');
        pcm.recType = 'audio';
        pcm.olderMoodle = scope.get('oldermoodle');
        pcm.socket = window.io(pcm.editorScope.get('serverurl'));

        // Show alert and redirect user if connection is not secure.
        pcm.check_secure();
        // Show alert if using non-ideal browser.
        pcm.check_browser();

        // Connect to premium recording server.
        pcm.init_connection();

        // Run when user clicks on "record" button.
        pcm.startStopBtn.on('click', function() {
            pcm.startStopBtn.set('disabled', true);

            // If button is displaying "Start Recording" or "Record Again".
            if ((pcm.startStopBtn.get('textContent') === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (pcm.startStopBtn.get('textContent') === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (pcm.startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Make sure the audio player and upload button are not shown.
                pcm.player.ancestor().ancestor().addClass('hide');
                pcm.uploadBtn.ancestor().ancestor().addClass('hide');

                // Change look of recording button.
                if (!pcm.olderMoodle) {
                    pcm.startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
                }

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make audio stream available at a higher level by making it a property of the common module.
                        pcm.stream = stream;

                        pcm.start_recording(pcm.recType, pcm.stream);
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        pcm.startStopBtn.set('textContent', btnLabel);
                        pcm.startStopBtn.set('disabled', false);
                        if (!pcm.olderMoodle) {
                            pcm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                        }
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = M.util.get_string('recordingfailed', 'atto_recordrtc');
                        var treatAsStopped = function() {
                            commonConfig.onMediaStopped(btnLabel);
                        };

                        // Handle getUserMedia-thrown errors.
                        // After alert, proceed to treat as stopped recording, or close dialogue.
                        switch (error.name) {
                            case 'AbortError':
                                pcm.show_alert('gumabort', treatAsStopped);

                                break;
                            case 'NotAllowedError':
                                pcm.show_alert('gumnotallowed', treatAsStopped);

                                break;
                            case 'NotFoundError':
                                pcm.show_alert('gumnotfound', treatAsStopped);

                                break;
                            case 'NotReadableError':
                                pcm.show_alert('gumnotreadable', treatAsStopped);

                                break;
                            case 'OverConstrainedError':
                                pcm.show_alert('gumoverconstrained', treatAsStopped);

                                break;
                            case 'SecurityError':
                                pcm.show_alert('gumsecurity', function() {
                                    pcm.editorScope.closeDialogue(pcm.editorScope);
                                });

                                break;
                            case 'TypeError':
                                pcm.show_alert('gumtype', treatAsStopped);

                                break;
                            default:
                                break;
                        }
                    }
                };

                // Capture audio stream from microphone.
                M.atto_recordrtc.premiumaudiomodule.capture_audio(commonConfig);
            } else { // If button is displaying "Stop Recording".
                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                window.setTimeout(function() {
                    pcm.startStopBtn.set('disabled', false);
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.premiumaudiomodule.stop_recording(pcm.stream);

                // Change button to offer to record again.
                pcm.startStopBtn.set('textContent', M.util.get_string('recordagain', 'atto_recordrtc'));
                if (!pcm.olderMoodle) {
                    pcm.startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                }
            }
        });
    },

    // Setup to get audio stream from microphone.
    capture_audio: function(config) {
        pcm.capture_user_media(
            // Media constraints.
            {
                audio: true
            },

            // Success callback.
            function(audioStream) {
                // Set audio player source to microphone stream.
                pcm.playerDOM.srcObject = audioStream;

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
        pcm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        // Show upload button.
        pcm.uploadBtn.ancestor().ancestor().removeClass('hide');
        pcm.uploadBtn.set('textContent', M.util.get_string('attachrecording', 'atto_recordrtc'));
        pcm.uploadBtn.set('disabled', false);

        // Handle when upload button is clicked.
        pcm.uploadBtn.on('click', function() {
            // Trigger error if no recording has been made.
            if (!pcm.player.get('src')) {
                pcm.show_alert('norecordingfound');
            } else {
                pcm.uploadBtn.set('disabled', true);

                pcm.insert_annotation(pcm.recType, pcm.player.get('src'));
            }
        });
    }
};
