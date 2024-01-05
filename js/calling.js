import {BandwidthUA} from "../node_modules/@bandwidth/bw-webrtc-sdk";

let phone = new BandwidthUA();
let activeCall = null;
let callTo='441138688226';
let token;
let serverConfig = {
    domain: 'sbc.webrtc-app.bandwidth.com',
   // domain: 'gw.webrtc-app.bandwidth.com',
    addresses: ['wss://sbc.webrtc-app.bandwidth.com:10081'],
   // addresses: ['wss://gw.webrtc-app.bandwidth.com:10081'],
    iceServers: ['stun.l.google.com:19302', 'stun1.l.google.com:19302', 'stun2.l.google.com:19302'],
    token: 'eyJraWQiOiJzZ25tLTE3OWU3Y2NkLTM0MzQtNGY5Yi05MjhlLWNkN2Y1ODEyNjNkNyIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJ2c3JpdmFzdGF2YV9hcGkiLCJhdWQiOiJiYW5kd2lkdGguY29tIiwic2NwIjpbXSwiYWNjZXNzX3R5cGUiOiJBUEkiLCJyb2xlcyI6WyJPcmRlcmluZyIsIlNJUCBDcmVkZW50aWFscyIsIkNvbmZpZ3VyYXRpb24iLCJ0ZXN0Um9sZSIsInZvaWNlX2luc2lnaHRzIiwiSHR0cFZvaWNlIiwiSFRUUCBBcHBsaWNhdGlvbiBNYW5hZ2VtZW50IiwiUmVwb3J0aW5nIl0sImlzcyI6Imh0dHBzOi8vaWQuYmFuZHdpZHRoLmNvbS9hcGkvdjEiLCJhY2N0X3Njb3BlIjoiQWNjb3VudCIsImFjY291bnRzIjpbIjk5MDEwNzgiXSwiZXhwIjoxNzA0NDQ5NTk1LCJpYXQiOjE3MDQ0NDk1MzUsImp0aSI6ImEyOWE1UnhrUUI5Sk84MTJmNFFRT0prIn0.VvN5wbRVoQRIkElnWZ_jUIGx3gjlPr2M43sP6_cVpEu9UdMrjUq9nawatsfgZDl3x8EqU-QdjHE9z2lTrqSbehaaqOEu5LZvzG0ugR3aAoGnQEIGatQjETtzCWMnzYLn7q0j-PcHrFODjGYCj-oW3V1NhyoQvVtJRqt9mHJPMgFl--nSQsE-qDp-cZinLNqgMHYpga9Cx-b5xGbVYGcDR9IjmDjmKHTlxmCgJdyNlBtlgWe_Gwka6taVeZw4MmjGGFp3_bctYtp3hDrhY9Owc5yAv1PAvOpxPRweLs8-HhbwvHiHLiDH4x7Apr2hd7GamoTHOMxUCkJoDz29mr0QLA'
};
let config = {
    // Call
    call: 'Victoria',
    caller: '12345',
    callerDN: '12345',
};

window.onload=documentData();
function documentData() {

    phone.setAcLogger(bw_log);
    phone.setJsSipLogger(console.log);

    bw_log(`------ Date: ${new Date().toDateString()} -------`);
    bw_log(`Bandwidth WebRTC SDK. Simple click-to-call`);
    bw_log(`SDK: ${phone.version()}`);
    bw_log(`SIP: ${JsSIP.C.USER_AGENT}`);


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
        let missedCallParameter = 'Missed "call" parameter in URL';
        guiError(missedCallParameter);
        bw_log(missedCallParameter);
        return;
     }

    let server = getParameter('server', null);
    if (server !== null) {
        serverConfig.addresses = [server];
    }
    token = serverConfig.token;

    guiInit();

    phone.checkAvailableDevices()
        .then(() => {
            let caller = getParameter('caller', '+441138688226');
            let callerDN = getParameter('callerDN', '+441138688226');
            initSipStack({ user: caller, displayName: callerDN, password: '' });
        })
        .catch((e) => {
            bw_log('error', e);
            guiError(e);
        })
}

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
    console.log("service config",serverConfig);
    console.log("account details",account);
    phone.setServerConfig(serverConfig.addresses, serverConfig.domain, serverConfig.iceServers);
    bw_log('setServerConfig>>> loginStateChanged: passed');

    phone.setAccount(account.user, account.displayName, account.password);
    bw_log('setAccount>>> loginStateChanged: passed');

    phone.setOAuthToken(token, true);
    bw_log('setOAuthToken>>> loginStateChanged: passed');

    // Set phone API listeners
    phone.setListeners({
        loginStateChanged: function (isLogin, cause) {
            switch (cause) {
                case "connected":
                    bw_log('phone>>> loginStateChanged: connected');
                    guiMakeCall(callTo);// after deinit() phone will disconnect SBC.

                    break;
                case "disconnected":
                    bw_log('pone>>> loginStateChanged: disconnected');
                    if (phone.isInitialized())
                        bw_log('pone>>> intialized done: connected');

                        guiError('Cannot connect to SBC server');
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
            let remoteVideo = document.getElementById('remote_video');
            let vs = remoteVideo.style;
            vs.display = 'block';
            vs.width = vs.height = call.hasReceiveVideo() ? 'auto' : 0;
            guiShowPanel('call_established_panel');
        },

        callShowStreams: function (call, localStream, remoteStream) {
            bw_log('phone>>> callShowStreams');
            let remoteVideo = document.getElementById('remote_video');
            remoteVideo.srcObject = remoteStream; // to play audio and optional video
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
    //document.getElementById('cancel_outgoing_call_btn').onclick = guiHangup;

}

function guiMakeCall(callTo) {
    if (activeCall !== null)
        throw 'Already exists active call';
    document.getElementById('outgoing_call_user').innerText = callTo;
    document.getElementById('outgoing_call_progress').innerText = '';
    document.getElementById('call_established_user').innerText = callTo;
    guiInfo('');
    guiShowPanel('outgoing_call_panel');
    let extraHeaders = [`User-to-User:eyJhbGciOiJIUzI1NiJ9.WyJoaSJd.-znkjYyCkgz4djmHUPSXl9YrJ6Nix_XvmlwKGFh5ERM;encoding=jwt,aGVsbG8gd29ybGQ;encoding=base64`];
    activeCall = phone.call(phone.AUDIO, callTo, extraHeaders);
}

function guiHangup() {
    if (activeCall !== null) {
        activeCall.terminate();
        activeCall = null;
    }
}

//--------------- Status line -------
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
            guiShow(panel);
        } else {
            guiHide(panel);
        }
    }
}
