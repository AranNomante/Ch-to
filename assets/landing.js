$(document).ready(function() {
    $('.list-group a').first().click();
})
$('.list-group a').on('click', function() {
    $('.list-group a').removeClass('active');
    $(this).addClass('active');
});