const boxes ={
    check_1:0,
    check_2:0,
    check_3:0,
    check_4:0,
    check_5:0
}
function setApply(){
    const id = this.id;
    if(id){
        const checked = (this.checked) ? 1:0;
        boxes[id]=checked;
        let check_str='';
        Object.keys(boxes).forEach(key => {
            if(boxes[key]){
                if(check_str.length>0){
                    check_str+=', ';
                }
                check_str+='P'+key.split('_')[1];
            }
        });
        $('#check_disp').text((check_str.length>0)?check_str:'NONE');
    }
}
$('.player_check').on('click',setApply);
