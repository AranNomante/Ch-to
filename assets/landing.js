$('.list-group a').on('click', function() {
    $('.list-group a').removeClass('active');
    $('.list-group a').removeClass('customactive');
    $(this).addClass('customactive');
});

$('.submit_tag').on('click', function() {
    const name = $('#usertag').val();
    if (name.length > 2 && name.length < 31) {
        window.location.href = "/?name=" + name;
    } else {
        alert('Please enter a valid name (minimum length 2 maximum 30)!');
    }
});