// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: '5qap5aO4i9A',
        events: {
            'onReady': onPlayerReady,
            //'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.mute();
    event.target.playVideo();
}

// 4. The API will call this function when the video player is ready.

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;

function onPlayerStateChange(event) {
    console.log(event);
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(unMuteVideo, 6000);
        done = true;
    }
}


function playVideo() {
    player.playVideo();
}

function pauseVideo() {
    player.pauseVideo();
}

function stopVideo() {
    player.stopVideo();
}