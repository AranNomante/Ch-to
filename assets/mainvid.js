// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
let player1;
let player2;
let player3;
let player4;
let player5;
const titles = {
    player1: 'pt_1',
    player2: 'pt_2',
    player3: 'pt_3',
    player4: 'pt_4',
    player5: 'pt_5',
}
const states = {
    player1: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED'
    },
    player2: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED'
    },
    player3: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED'
    },
    player4: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED'
    },
    player5: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED'
    }
}
const reversePmap = {
    player1: null,
    player2: null,
    player3: null,
    player4: null,
    player5: null
}

function onYouTubeIframeAPIReady() {
    player1 = initPlayer('player1');
    player2 = initPlayer('player2');
    player3 = initPlayer('player3');
    player4 = initPlayer('player4');
    player5 = initPlayer('player5');
    reversePmap.player1 = player1;
    reversePmap.player2 = player2;
    reversePmap.player3 = player3;
    reversePmap.player4 = player4;
    reversePmap.player5 = player5;
}


function initPlayer(id) {
    return new YT.Player(id, {
        videoId: '5qap5aO4i9A',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        },
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'showinfo': 0
        }
    })
}

function onPlayerReady(event) {
    //console.log(event.target);
    const id = event.target.h.id;
    $(`#${titles[id]}`).text(event.target.getVideoData().title.substring(0, 30));
    //console.log(event.target.h.id);
    if (!(id === 'player1')) {
        event.target.mute();
    }
    setState(id, event);
}

// 4. The API will call this function when the video player is ready.

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
let active_count = 0;

function onPlayerStateChange(event) {
    //UNSTARTED -1 ENDED 0 PLAYING 1 PAUSED 2 BUFFERING 3 CUED 5
    const id = event.target.h.id;
    if (event.data == YT.PlayerState.PLAYING && active_count < 4 && !(id === 'player1')) {
        event.target.stopVideo();
        active_count++;
    }
    setState(id, event);
}

function onPlayerError(event) {
    console.log(event);
    setState(event.target.h.id, event);
}

function extractYTid(url) {
    return url.split('v=')[1];
}

function setState(id, event) {
    states[id].play = getPlayState(event.data, id);
    states[id].isMuted = event.target.isMuted();
}

function getPlayState(signal, id) {
    const htmelem = $(`.play.p_${id.substring(6,7)}`);
    switch (signal) {
        case -1:
            return 'UNSTARTED';
        case 0:
            htmelem.text('Restart🔄');
            return 'ENDED';
        case 1:
            htmelem.text('Pause⏸️');
            return 'PLAYING';
        case 2:
            htmelem.text('Play▶️');
            return 'PAUSED';
        case 3:
            return 'BUFFERING';
        case 5:
            htmelem.text('Play▶️');
            return 'CUED';
        default:
            return null;
    }
}
$('.play').on('click', function() {
    const id = 'player' + $(this).attr('class').split(' ')[1].split('_')[1];
    const tplayer = reversePmap[id];
    if (tplayer) {
        switch (states[id].play) {
            case 'CUED':
                tplayer.playVideo();
                break;
            case 'ENDED':
                tplayer.seekTo(0);
                break;
            case 'PLAYING':
                console.log('paused');
                tplayer.pauseVideo();
            case 'PAUSED':
                tplayer.playVideo();
        }
    }
});
$('.unmute').on('click', function() {
    const id = 'player' + $(this).attr('class').split(' ')[1].split('_')[1];
    const tplayer = reversePmap[id];
    tplayer.unMute();
    states[id].isMuted = false;
});
$('.mute').on('click', function() {
    const id = 'player' + $(this).attr('class').split(' ')[1].split('_')[1];
    const tplayer = reversePmap[id];
    tplayer.mute();
    states[id].isMuted = true;
})