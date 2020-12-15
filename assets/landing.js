$('.list-group a').on('click', function() {
    $('.list-group a').removeClass('active');
    $('.list-group a').removeClass('customactive');
    $(this).addClass('customactive');
});

$('.submit_tag').on('click', function() {
    const name = $('#usertag').val();
    if (name.length > 2 && name.length < 30) {
        window.location.href = "/?name=" + name;
    } else {
        alert('Please use a valid name between 2 to 30 characters!');
    }
})