const boxes = {
  check_1: 0,
  check_2: 0,
  check_3: 0,
  check_4: 0,
  check_5: 0,
};
/**
 * Check applicable
 */
function setApply() {
  const id = this.id;
  if (id) {
    const checked = this.checked ? 1 : 0;
    boxes[id] = checked;
    let checkStr = '';
    Object.keys(boxes).forEach((key) => {
      if (boxes[key]) {
        if (checkStr.length > 0) {
          checkStr += ', ';
        }
        checkStr += 'P' + key.split('_')[1];
      }
    });
    $('#check_disp').text(checkStr.length > 0 ? checkStr : 'NONE');
  }
}
/**
 * ui states
 */
function setDisplayStates() {
  let setMsg = '';
  let visible = 0;
  let invisible = 0;
  Object.keys(boxes).forEach((item) => {
    if (boxes[item]) {
      const disp = states['player' + item.split('_')[1]].display;
      disp ? visible++ : invisible++;
    }
  });
  if (visible && invisible) {
    setMsg = 'Display/Hide 🎬';
  } else if (visible) {
    setMsg = 'Hide 🎬';
  } else if (invisible) {
    setMsg = 'Display 🎬';
  } else {
    setMsg = 'Display/Hide 🎬';
  }
  $('.displayall').text(setMsg);
}
/**
 * Ui states
 */
function setPlayStates() {
  let setMsg = '';
  const validStates = {
    PAUSED: 0,
    PLAYING: 0,
    ENDED: 0,
  };
  Object.keys(boxes).forEach((item) => {
    if (boxes[item]) {
      const play = states['player' + item.split('_')[1]].play;
      validStates[play]++;
    }
  });
  if (validStates.ENDED) {
    setMsg = 'Restart 🔄';
  } else if (validStates.PLAYING) {
    setMsg = 'Pause ⏸️';
  } else {
    setMsg = 'Play ▶️';
  }
  $('.playall').text(setMsg);
}
/**
 * Player ui
 */
function updatePlayerVisuals() {
  setPlayStates();
  setDisplayStates();
  Object.keys(states).forEach((item) => {
    const targetClass = '.p_' + item.substring(6, 7);
    const state = states[item];
    $('.display_state' + targetClass).text(
      state.display ? 'DISPLAY ON' : 'DISPLAY OFF'
    );
    $('.sound_state' + targetClass).text(
      state.isMuted ? 'SOUND OFF' : 'SOUND ON'
    );
    $('.play_state' + targetClass).text(state.play);
  });
}
$('.player_check').on('click', setApply);
setInterval(updatePlayerVisuals, 1000);
