const params = (new URL(document.location)).searchParams;
const error = params.get('error');
if (error && error.length > 0) {
    if (error === 'invalid') {
        setSnack('Please enter a valid name (minimum length 2 maximum 30)!');
    } else if (error === 'taken') {
        setSnack('This name is taken please try another one!');
    }
}

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
        setSnack('Please enter a valid name (minimum length 2 maximum 30)!');
        //alert('Please enter a valid name (minimum length 2 maximum 30)!');
    }
});