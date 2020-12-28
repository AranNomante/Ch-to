const boxes = {
	check_1: 0,
	check_2: 0,
	check_3: 0,
	check_4: 0,
	check_5: 0
}

function setApply() {
	const id = this.id;
	if (id) {
		const checked = (this.checked) ? 1 : 0;
		boxes[id] = checked;
		let check_str = '';
		Object.keys(boxes).forEach(key => {
			if (boxes[key]) {
				if (check_str.length > 0) {
					check_str += ', ';
				}
				check_str += 'P' + key.split('_')[1];
			}
		});
		$('#check_disp').text((check_str.length > 0) ? check_str : 'NONE');
	}
}

function setDisplayStates() {
	let set_msg = '';
	let visible = 0;
	let invisible = 0;
	Object.keys(boxes).forEach(item => {
		if (boxes[item]) {
			let disp = states['player' + item.split('_')[1]].display;
			(disp) ? visible++ : invisible++;
		}
	});
	if (visible && invisible) {
		set_msg = 'Display/Hide 🎬';
	} else if (visible) {
		set_msg = 'Hide 🎬';
	} else if (invisible) {
		set_msg = 'Display 🎬';
	} else {
		set_msg = 'Display/Hide 🎬';
	}
	$('.displayall').text(set_msg);
}

function setPlayStates() {
	let set_msg = '';
	const valid_states = {
		PAUSED: 0,
		PLAYING: 0,
		ENDED: 0
	}
	Object.keys(boxes).forEach(item => {
		if (boxes[item]) {
			let play = states['player' + item.split('_')[1]].play;
			valid_states[play]++;
		}
	});
	if (valid_states.ENDED) {
		set_msg = 'Restart 🔄';
	} else if (valid_states.PLAYING) {
		set_msg = 'Pause ⏸️';
	} else {
		set_msg = 'Play ▶️';
	}
	$('.playall').text(set_msg);
}

function updatePlayerVisuals() {
	setPlayStates();
	setDisplayStates();
	Object.keys(states).forEach(item => {
		let target_class = '.p_' + item.substring(6, 7);
		let state = states[item];
		$('.display_state' + target_class).text((state.display) ? 'DISPLAY ON' : 'DISPLAY OFF');
		$('.sound_state' + target_class).text((state.isMuted) ? 'SOUND OFF' : 'SOUND ON');
		$('.play_state' + target_class).text(state.play);
	});
}
$('.player_check').on('click', setApply);
setInterval(updatePlayerVisuals, 1000);
