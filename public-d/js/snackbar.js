/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "setSnack" }]*/
const awaitingNots = [];
/**
 * displays snack bar
 * @param {string} text
 */
function snack(text) {
  const bar = $('#snackbar');
  bar.text(text);
  bar.addClass('show');
  setTimeout(function () {
    bar.removeClass('show');
  }, 5000);
}
/**
 * inserts snack text to awaiting array
 * @param {string} text
 */
function setSnack(text) {
  if (!awaitingNots.includes(text)) {
    awaitingNots.splice(0, 0, text);
  }
}
/**
 * Shows snack if eligible
 */
function showNotif() {
  if (awaitingNots.length > 0 && !$('#snackbar').hasClass('show')) {
    const notif = awaitingNots.pop();
    snack(notif);
  }
}
setInterval(showNotif, 1000);
