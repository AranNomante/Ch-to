const procedure=[
    function(){$('.line').css('height','50%');$('.room').show()},
    function(){$('.line').css('height','90%');$('.chat').hide()},
    function(){$('.chat').show();$('.room').hide()}
]
let i=0;
function switchView(){
    i=(i+1)%3;
    procedure[i]();
}
$('#switch_view').on('click',switchView);
