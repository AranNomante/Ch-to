const procedure = [
  function () {
    $('#main .line').css('height', '50%');
    $('.room').show();
  },
  function () {
    $('#main .line').css('height', '95%');
    $('.chat').hide();
  },
  function () {
    $('.chat').show();
    $('.room').hide();
  },
];
let i = 0;
/**
 * Resize view
 */
function switchView() {
  i = (i + 1) % 3;
  procedure[i]();
}
$('#switch_view').on('click', switchView);
