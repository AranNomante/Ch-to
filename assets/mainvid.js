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

function onYouTubeIframeAPIReady() {
    player1 = initPlayer('player1');
    player2 = initPlayer('player2');
    player3 = initPlayer('player3');
    player4 = initPlayer('player4');
    player5 = initPlayer('player5');
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
    if (event.target.f.id === 'player1') {
        event.target.mute();
        event.target.playVideo();
    }
}
// 4. The API will call this function when the video player is ready.

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;

function onPlayerStateChange(event) {
    //UNSTARTED -1 ENDED 0 PLAYING 1 PAUSED 2 BUFFERING 3 CUED 5
    /*if (event.data == YT.PlayerState.PLAYING && !done) {
            setTimeout(unMuteVideo, 6000);
            done = true;
        }*/
}

function onPlayerError(event) {
    console.log(event);
}

function startVideo(obj) {
    obj.playVideo();
}

function pauseVideo(obj) {
    obj.pauseVideo();
}

function stopVideo(obj) {
    obj.stopVideo();
}

function extractYTid(url) {
    return url.split('v=')[1];
}