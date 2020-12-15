$('.list-group a').on('click', function() {
    $('.list-group a').removeClass('active');
    $('.list-group a').removeClass('customactive');
    $(this).addClass('customactive');
});