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
        display: 1,
        play: 'UNSTARTED',
        firstTime: true
    },
    player2: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED',
        firstTime: true
    },
    player3: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED',
        firstTime: true
    },
    player4: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED',
        firstTime: true
    },
    player5: {
        isMuted: false,
        display: 0,
        play: 'UNSTARTED',
        firstTime: true
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
            //'autoplay': 1,
            'controls': 1,
            'disablekb': 1,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'showinfo': 0,
            'enablejsapi': 1
        }
    })
}

function onPlayerReady(event) {
    setPlayerTitle(event);
    event.target.mute();
    setState(id, event);
}

// 4. The API will call this function when the video player is ready.

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.


function onPlayerStateChange(event) {
    //UNSTARTED -1 ENDED 0 PLAYING 1 PAUSED 2 BUFFERING 3 CUED 5
    const id = event.target.h.id;
    if (event.data == YT.PlayerState.PLAYING && states[id].firstTime) {
        setPlayerTitle(event);
        event.target.pauseVideo();
        event.target.seekTo(0);
        states[id].firstTime = false;
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
    setAllstates();
}

function setAllstates() {
    const allelem = $('.playall');
    let highest_order_action = 'PAUSED';
    Object.keys(states).forEach(item => {
        let cur_state = states[item].play;
        if (cur_state === 'PLAYING' && highest_order_action === 'PAUSED') {
            highest_order_action = cur_state;
        } else if (cur_state === 'ENDED') {
            highest_order_action = cur_state;
        }
    });
    if (highest_order_action === 'PLAYING') {
        allelem.text('Pause⏸️');
    } else if (highest_order_action === 'ENDED') {
        allelem.text('Restart🔄');
    } else {
        allelem.text('Play▶️');
    }
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
                //console.log('paused');
                tplayer.pauseVideo();
                break;
            case 'PAUSED':
                tplayer.playVideo();
                break;
        }
    }
});
$('.playall').on('click', function() {
    let ok = true;
    let highest_order_action = 'PAUSED';
    let valid_states = ['CUED', 'ENDED', 'PLAYING', 'PAUSED'];
    Object.keys(states).forEach(item => {
        let cur_state = states[item].play;
        if (valid_states.includes(cur_state)) {
            if (cur_state === 'PLAYING' && highest_order_action === 'PAUSED') {
                highest_order_action = cur_state;
            } else if (cur_state === 'ENDED') {
                highest_order_action = cur_state;
            }
        } else {
            ok = false;
        }
    });
    //console.log(highest_order_action);
    if (ok) {
        if (highest_order_action === 'ENDED') {
            Object.keys(reversePmap).forEach(item => {
                reversePmap[item].pauseVideo();
                reversePmap[item].seekTo(0);
                reversePmap[item].playVideo();
            });
        } else if (highest_order_action === 'PLAYING') {
            Object.keys(reversePmap).forEach(item => {
                reversePmap[item].pauseVideo();
            });
        } else {
            Object.keys(reversePmap).forEach(item => {
                reversePmap[item].playVideo();
            });
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

$('.display').on('click', function() {
    const id = 'player' + $(this).attr('class').split(' ')[1].split('_')[1];
    const elem = $(`#${id}`);
    let visibleCount = 0;
    Object.keys(states).forEach(item => {
        visibleCount += states[item].display;
    });
    organizeVidDisplay(elem, states[id].display, visibleCount);
});
$('.unmuteall').on('click', function() {
    Object.keys(reversePmap).forEach(item => {
        reversePmap[item].unMute();
    });
});
$('.muteall').on('click', function() {
    Object.keys(reversePmap).forEach(item => {
        reversePmap[item].mute();
    });
});

const nmMap = {
    0: 'no',
    1: 'solo',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five'
}
$('.displayall').on('click', function() {
    let visibleCount = 0;
    Object.keys(states).forEach(item => {
        visibleCount += states[item].display;
    });
    for (let i = 0; i < 6; i++) {
        Object.keys(reversePmap).forEach(item => {
            $('#' + item).removeClass(nmMap[i]);
        });
    }
    if (visibleCount > 0) {
        Object.keys(reversePmap).forEach(item => {
            $('#' + item).addClass(nmMap[0]);
        });
    } else {
        Object.keys(reversePmap).forEach(item => {
            $('#' + item).addClass(nmMap[5]);
        });
    }
    Object.keys(states).forEach(item => {
        states[item].display = (visibleCount > 0) ? 0 : 1;
    });
});
let load_mode = 'i';

function organizeVidDisplay(elem, disp, visibleCount) {
    let exact = nmMap[visibleCount];
    let dif = (disp === 1) ? nmMap[visibleCount - 1] : nmMap[visibleCount + 1];
    (disp === 1) ? elem.removeClass(exact): elem.addClass(dif);
    $('.vid.' + exact).removeClass(exact).addClass(dif);
    states[elem.attr('id')].display = (disp === 1) ? 0 : 1;
}
$('#toggle_load').on('click', function() {
    if ($('#load_all').parent().css('display') === 'none') {
        $('.load_i').parent().css('display', 'none');
        $('#load_all').parent().css('display', 'block');
        load_mode = 'a';
    } else {
        $('.load_i').parent().css('display', 'block');
        $('#load_all').parent().css('display', 'none');
        load_mode = 'i';
    }
});
$('#load_init').on('click', function() {
    if (load_mode === 'i') {
        loadIndividual();
    } else {
        loadAll();
    }
});

function loadAll() {
    let url = $('#load_all').val();
    url = extractYTid(url);
    Object.keys(reversePmap).forEach(item => {
        reversePmap[item].pauseVideo();
        reversePmap[item].loadVideoById(url, 0);
        states[item].firstTime = true;
    });
}

function loadIndividual() {
    const urls = {
        player1: $('#load_1').val(),
        player2: $('#load_2').val(),
        player3: $('#load_3').val(),
        player4: $('#load_4').val(),
        player5: $('#load_5').val()
    }
    Object.keys(urls).forEach(item => {
        if (urls[item].length > 0) {
            let url = extractYTid(urls[item]);
            reversePmap[item].pauseVideo();
            reversePmap[item].loadVideoById(url, 0);
            states[item].firstTime = true;
        }
    });

}

function setPlayerTitle(event) {
    const id = event.target.h.id;
    const title = event.target.getVideoData().title;
    let title_f = title.substring(0, 40);
    title_f += (title.length > 40) ? '...' : '';
    $(`#${titles[id]}`).text(title_f);
}