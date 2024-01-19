import {BandwidthUA} from  "../node_modules/@bandwidth/bw-webrtc-sdk";

let phone = new BandwidthUA();
let activeCall = null;
let callTo;
let serverConfig = {
    domain: 'gw.webrtc-app.bandwidth.com',
    addresses: ['wss://gw.webrtc-app.bandwidth.com:10081'],
    iceServers: ['stun.l.google.com:19302', 'stun1.l.google.com:19302', 'stun2.l.google.com:19302'],
    token:'',
};
const myButton = document.querySelector(".mybutton");
function documentData() {
    phone.setAcLogger(bw_log);
    phone.setJsSipLogger(console.log);
    // Check WebRTC support.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        let noWebRTC = 'WebRTC API is not supported in this browser !';
        guiError(noWebRTC);
        bw_log(noWebRTC);
        return;
    }

   //Get call parameters from URL
    callTo = getParameter('callTo');
    if (callTo === null) {
        let missedCallParameter = 'Please add calling number in textbox';
        guiError(missedCallParameter);
        bw_log(missedCallParameter);
        return;
     }
    guiInit();

    phone.checkAvailableDevices()
        .then(() => {
            let caller = getParameter('caller', '+111111111111');
            let callerDN = getParameter('callerDN', '+11111111111');
            initSipStack({ user: caller, displayName: callerDN, password: '' });
        })
        .catch((e) => {
            bw_log('error', e);
            guiError(e);
        })
}
myButton.onclick = documentData();

function bw_log() {
    let args = [].slice.call(arguments)
    console.log.apply(console, ['%c' + args[0]].concat(['color: BlueViolet;'], args.slice(1)));
}

function getParameter(name, defValue = null) {
    let s = window.location.search.split('&' + name + '=')[1];
    if (!s) s = window.location.search.split('?' + name + '=')[1];
    return s !== undefined ? decodeURIComponent(s.split('&')[0]) : defValue;
}

function initSipStack(account) {
    phone.setServerConfig(serverConfig.addresses, serverConfig.domain, serverConfig.iceServers);
    phone.setAccount(account.user, account.displayName, account.password);
    phone.setOAuthToken(serverConfig.token, true);
    phone.setListeners({
        loginStateChanged: function (isLogin, cause) {
            switch (cause) {
                case "connected":
                    bw_log('phone>>> loginStateChanged: connected');
                    guiMakeCall(callTo);
                    break;
                case "disconnected":
                    bw_log('pone>>> loginStateChanged: disconnected');
                    if (phone.isInitialized())
                        bw_log('pone>>> intialized done: connected');
                    break;
                case "login failed":
                    bw_log('phone>>> loginStateChanged: login failed');
                    break;
                case "login":
                    bw_log('phone>>> loginStateChanged: login');
                    break;
                case "logout":
                    bw_log('phone>>> loginStateChanged: logout');
                    break;
            }
        },

        outgoingCallProgress: function (call, response) {
            bw_log('phone>>> outgoing call progress');
            document.getElementById('outgoing_call_progress').innerText = 'Call In Progress';
        },

        callTerminated: function (call, message, cause, redirectTo) {
            bw_log(`phone>>> call terminated callback, cause=${cause}`);
            if (call !== activeCall) {
                bw_log('terminated no active call');
                guiShowPanel('call_terminated_panel');
                return;
            }
            activeCall = null;
            guiWarning('Call terminated: ' + cause);
            phone.deinit(); // Disconnect from SBC server.
            guiShowPanel('call_terminated_panel');
        },

        callConfirmed: function (call, message, cause) {
            bw_log('phone>>> callConfirmed');
            guiInfo('');
            guiShowPanel('call_established_panel');
        },

        callShowStreams: function (call, localStream, remoteStream) {
            bw_log('phone>>> callShowStreams');
            let remoteAudio = document.getElementById('remote_audio');
            remoteAudio.srcObject = remoteStream;
        },

        incomingCall: function (call, invite) {
            bw_log('phone>>> incomingCall');
            call.reject();
        },

        callHoldStateChanged: function (call, isHold, isRemote) {
            bw_log('phone>>> callHoldStateChanged ' + isHold ? 'hold' : 'unhold');
        }
    });

    guiInfo('Connecting...');
    phone.init(false);
}

function onBeforeUnload() {
    phone !== null && phone.isInitialized() && phone.deinit();
}

function guiInit() {
    window.addEventListener('beforeunload', onBeforeUnload);
    document.getElementById('cancel_outgoing_call_btn').onclick = guiHangup;
    document.getElementById('hangup_btn').onclick = guiHangup;
    document.getElementById('mute_audio_btn').onclick = guiMuteAudio;
}

function guiMakeCall(callTo) {
    console.log("test call to",callTo);

    if (activeCall !== null)
        throw 'Already exists active call';
    document.getElementById('outgoing_call_user').innerText = callTo.toString();
    document.getElementById('outgoing_call_progress').innerText = '';
    document.getElementById('call_established_user').innerText = callTo;

    guiInfo('');

    guiShowPanel('outgoing_call_panel');
    activeCall = phone.call(callTo);
}

function guiHangup() {
    if (activeCall !== null) {
        activeCall.terminate();
        activeCall = null;
    }
}

function guiMuteAudio() {
    let muted = activeCall.isAudioMuted();
    activeCall.muteAudio(!muted);
    document.getElementById('mute_audio_btn').value = !muted ? 'Unmute' : 'Mute';
}
function guiError(text) { guiStatus(text, 'Pink'); }

function guiWarning(text) { guiStatus(text, 'Gold'); }

function guiInfo(text) { guiStatus(text, 'Aquamarine'); }

function guiStatus(text, color) {
    let line = document.getElementById('status_line');
    line.setAttribute('style', `background-color: ${color}`);
    line.innerHTML = text;
}
function guiShowPanel(activePanel) {
    const panels = ['call_terminated_panel', 'outgoing_call_panel', 'call_established_panel'];
    for (let panel of panels) {
        if (panel === activePanel) {
            console.log("panel show"+panel);

            guiShow(panel);
        } else {
            console.log("panel hide"+panel);
            guiHide(panel);
        }
    }
}
function guiShow(id) {
    document.getElementById(id).style.display = 'block';
}
function guiHide(id) {
    document.getElementById(id).style.display = 'none';
}
