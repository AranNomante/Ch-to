function openNav() {
	document.getElementById("mySidebar").style.width = "250px";
	document.getElementById("main").style.marginLeft = "250px";
	$('#mySidebar').fadeIn('slow');
}

function closeNav() {
	$('#mySidebar').hide();
	document.getElementById("mySidebar").style.width = "0";
	document.getElementById("main").style.marginLeft = "0";
}

function toggleNav() {
	if ($('#mySidebar').css('display') === 'none') {
		openNav();
	} else {
		closeNav();
	}
}
$(document).on('click', '#main', function(event) {
	//console.log($(event.target).attr('class'))
	const cls = $(event.target).attr('class');
	if (cls && !(cls.includes('nav-link')) && $('#mySidebar').css('display') === 'block') {
		closeNav();
	}
});
$(document).on('click', '.closebtn', function() {
	closeNav();
})
$(document).on('click', '#open_nav', function() {
	toggleNav();
})
