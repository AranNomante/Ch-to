const awaiting_nots = [];

function snack(text) {
	const bar = $('#snackbar');
	bar.text(text);
	bar.addClass("show");
	setTimeout(function() {
		bar.removeClass("show")
	}, 5000);
}

function setSnack(text) {
	if (!awaiting_nots.includes(text)) {
		awaiting_nots.splice(0, 0, text);
	}
}

function showNotif() {
	if (awaiting_nots.length > 0 && !$('#snackbar').hasClass('show')) {
		const notif = awaiting_nots.pop();
		snack(notif);
	}
}
setInterval(showNotif, 1000);
