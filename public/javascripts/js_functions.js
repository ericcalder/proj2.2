

function selectRow(data){
      $('.payments .table tbody tr').on('click', function(){

        console.log('payments clicked')
        var tableRow=$(this).index()
        console.log('tableRow=='+tableRow)
        console.log('data===='+JSON.stringify(data))
        var tr={}
        tr.id=data[tableRow].id;
        tr.date=data[tableRow].date;
        tr.amt=data[tableRow].amt;
        tr.trans=data[tableRow].trans;
        console.log('row='+tableRow)
      //  console.log('row data=='+data[tableRow])
        console.log('tr data==='+tr.id+'  '+tr.date+'   '+tr.amt+'   '+tr.trans)
        //$('#no_custID_').modal('show');//show payments
        noFindCustID(tr, tableRow)
        })//'.payments .table tbody tr').on('click'
        }  //////////////////////////

//////////////////////////////////
function noFindCustID(tr, tableRow, page){
  console.log('in noFindCustID')
  //$('.csv .table tbody tr:eq('+tableRow+') td:eq(0)')
    //                  .text('no find');
  var tag='#no_custID_ .modal-body #searchInput'
  $('#no_custID_ .modal-title').empty()
                  .append('</br>'+tr.date+'  '+tr.amt+'  '+tr.trans)
  $('#no_custID_ .modal-body div#Customer h5 table tbody').empty();
  $('#no_custID_ .modal-body div#Customer input#searchInput').val('');
  $('#no_custID_ .modal-body p#custID_display').empty();
  $('#no_custID_ .modal-body h4').empty();
  $('#no_custID_').modal('show');
  //////// show dete button only in payments
  if(page=='payments'){
    $('#no_custID_ div.modal-footer button.btn#delete').show()
  }///// if
  //////////////////////////
  //////////////////autocompleteautocompleteautocomplete
  $(tag).autocomplete({
        appendTo: $(tag).parent(),
        source: function(req, res){
        
        $.ajax({
          url: '/csv/autocomplete',
          data: {term:  req.term},
  
            success: function(data){
              var len=data.length;
              var arr=new Array();
              console.log('data.length===',len)
            if(data.length>0){
              if(!data[0].prop){
                console.log('prop is not defined')
                //var arr=new Array();
                for (var i=0; i<len; i++){
                  arr.push({label: data[i].name, id: data[i].id});
                }//for
              }//if
              else {
              //var arr=new Array();
                for (var i=0; i<len; i++){
                    arr.push({label: data[i].prop, id: data[i].id});
                }//for
                }//else
              }//if data.length>0 (options are found)
              else {arr.push({label:'no records found'})}
              res(arr);
            }///success
            
        });/// ajax
      },//// source
        minLength: 4,
        select: function(event, ui){
          console.log('prop='+ui.item.label+
            ' custID='+ui.item.id);
          //$('#no_custID_ .modal-footer .confirm').show();
          $('#no_custID_ .modal-body h4').empty().append('custID='+ui.item.id+
            ' prop=='+ui.item.label)
          display(ui.item.id,0,tr.id,page)
          $('#no_custID_ .modal-footer .confirm').on('click',function(){
            $('.csv .table tbody tr:eq('+tableRow+') td:eq(0)')
                      .text(ui.item.id);
            $('#no_custID_').modal('hide'); 
            

          })
          return

        }
      });//autocomplete
  /////////////////////autocompleteautocomplete//

  //////////////////////////////////////////////
  ///////button#checkbutton#checkbutton#check//////
  ///////////////////////////////////////////////
$('#no_custID_ .modal-body button#check').off().on('click', function(){
  console.log('in check')
  var str=tr.trans.match(/,.*,|Giro.*/)[0]
  console.log('transactio=='+tr.trans+' str==='+str)
  ////////////////////////////////////////////////
  $.get('csv/search',{str:str}, function(data){
    console.log('in search data.length='+data.length)
    console.log(' results==='+JSON.stringify(data[0]))

    $('#no_custID_ .modal-body h5 table tbody').empty()
    for(var i=0; i<data.length;i++){
              $('#no_custID_ .modal-body h5 table tbody').append(
                '<tr><td>'+data[i].custID+'&nbsp</td><td>'
                +data[i].tdat+'&nbsp</td><td>'
                +data[i].amt+'&nbsp</td><td>'
                +data[i].trans+'&nbsp </td></tr>'
                )
    }//for
//////////////////////////////////////////////////////
      $('#no_custID_ .modal-body h5 table tbody tr').on('click', function(){
        console.log('In select')
         var tableRow=$(this).index()
        
        console.log('row='+tableRow)
        var item=$('#no_custID_ .modal-body h5 table tbody tr:eq('+tableRow+')').text();
        console.log('item==='+item)
        var custID=$('#no_custID_ .modal-body h5 table tbody tr:eq('+tableRow+') td:eq(0)')
        .text();
         var trans=$('#no_custID_ .modal-body h5 table tbody tr:eq('+tableRow+') td:eq(3)')
        .text();
        console.log('custID==='+custID+'   rec=='+tr.id)
        display(custID,1,tr.id, page)
        
      })//on click
//////////////////////////////////////////////


    
  })// get

})/// #button#checkbutton#checkbutton#check        
  //////////////////////////////
  /////  on delete clicked /////////
$('#no_custID_ div.modal-footer button.btn#delete').on('click', function(){
  delPayment(tr,tableRow,'payments')
})
  //////////////////////////////
}//function(noFindCustID)
    ///////



////////////////////////////////////////////////
//////////  functions //////
//////////////////////////////////////////
function display(custID, event,rec, page){
  
  $.get('csv/display',{custID:custID},function(data){
    console.log('in display')
    if(!data.length){console.log('no data for this custID'); return}
    console.log('display data=='+JSON.stringify(data))
    console.log('id=='+data[0].id+' name=='+data[0].name+' prop=='+data[0].prop)
      if(event==0){
          $('#no_custID_ .modal-body h4').empty().append(' '+data[0].id+' '+data[0].name+' '+data[0].prop)
      }
      else {
          $('#no_custID_ .modal-body p#custID_display').empty()
          .append(' '+data[0].id+' '+data[0].name+' '+data[0].prop)  
      }
  })//get
  
  console.log('custID===='+custID+'  event=='+event)
  $('#no_custID_ .modal-body button#update').show()
  $('#no_custID_ .modal-body button#update').on('click', function(){
    console.log('in update   '+custID+' ev=='+event)
    update(custID,rec, page)
  })
}
///////////////////////////////
function update(custID, rec, page){
  console.log('in update  '+custID+'  rec=='+rec);
  if(page=='payments'){
    $.post('/payments/update',{custID: custID, rec: rec}, function(data){
    console.log('in payments/update')
    $('#no_custID_').modal('hide');
    refresh(page);
  })//post  
  }//if
  else{
  $.post('/csv/update',{custID: custID, rec: rec}, function(data){
    console.log('in csv/update')
    $('#no_custID_').modal('hide');
    refresh(page);
  })//post
}//else
}
/////////////////////////////

function refresh(page){
  
  if(page=='payments')
              {
                console.log('in refresh payments')
          $.get('payments/', function(data){
                $('.payments .table tbody').empty();                      
            for(var i=0; i<data.length;i++){
      
                $('.payments .table tbody').append(
                  '<tr><td>'+data[i].id+'</td><td>'
                  +data[i].custID+'</td><td>'
                  +data[i].date+'</td><td>'
                  +data[i].amt+'</td><td>'
                  +data[i].trans+'</td></tr>')
                  //+data[i][3].match(/,\s.*,/)+'</td></tr>')
      //          console.log('lastIndexOf=='+data[i][3].slice(data[i][3].lastIndexOf(',')))
                
            }//for
          })//get
          location.reload();
    }//if
  else {
  console.log('in refresh')
  var rec1=$('body').data().rec1
console.log('rec1========'+rec1)

  $.get('csv/refresh',{rec1: rec1}, function(data){
    console.log(data);
    $('.payments .table tbody').empty();
    for(var i=0; i<data.length;i++){
      
                $('.payments .table tbody').append(
                  '<tr><td>'+data[i].id+'</td><td>'
                  +data[i].custID+'</td><td>'
                  +data[i].date+'</td><td>'
                  +data[i].amt+'</td><td>'
                  +data[i].trans+'</td></tr>')
                  //+data[i][3].match(/,\s.*,/)+'</td></tr>')
      //          console.log('lastIndexOf=='+data[i][3].slice(data[i][3].lastIndexOf(',')))
                
    }//for
  
    console.log('refresh  data[0]' +JSON.stringify(data[0]))
    selectRow(data)
  })//get
}//else
}
//////////////////////////////////

////////////////////////////////////////
function arrToObj(arr, obj){
  for(var i=0; i<arr.length;i++){
            var csvRow={}
            csvRow.date=arr[i][0]
            csvRow.amt=arr[i][1]
            csvRow.trans=arr[i][2]
            csvRow.custID=arr[i][3]
            obj.push(csvRow)
          }
          //console.log('obj=='+JSON.stringify(obj))
          return obj
}
    ///////////////////////////////////
function hasCustID(){
  console.log('in hasCustID')
  var tag='#payment_ .modal-body #searchInput'
  $(tag).autocomplete({
        appendTo: $(tag).parent(),
        source: function(req, res){
        
        $.ajax({
          url: '/csv/autocomplete',
          data: {term:  req.term},
  
            success: function(data){
              var len=data.length;
              var arr=new Array();
              console.log('data.length===',len)
            if(data.length>0){
              if(!data[0].prop){
                console.log('prop is not defined')
                //var arr=new Array();
                for (var i=0; i<len; i++){
                  arr.push({label: data[i].name, id: data[i].id});
                }//for
              }//if
              else {
              //var arr=new Array();
                for (var i=0; i<len; i++){
                    arr.push({label: data[i].prop, id: data[i].id, name:data[i].name});
                }//for
                }//else
              }//if data.length>0 (options are found)
              else {arr.push({label:'no records found'})}
              res(arr);
            }///success
            
        });/// ajax
      },//// source
        minLength: 4,
        select: function(event, ui){
          console.log('prop='+ui.item.label+
            ' custID='+ui.item.id+'   name=='+ui.item.name);
         
          $('#payment_ form.cash p#custID').empty().append(ui.item.id);
          console.log('custID++++++++'+$('#payment_ form.cash p#custID').text())
          //$('#no_custID_ .modal-footer .confirm').show();
          /*
          $('#no_custID_ .modal-body h4').empty().append('custID='+ui.item.id+
            ' prop=='+ui.item.label)

          display(ui.item.id,0,tr.id,page)
          $('#no_custID_ .modal-footer .confirm').on('click',function(){
            $('.csv .table tbody tr:eq('+tableRow+') td:eq(0)')
                      .text(ui.item.id);
            
            $('#no_custID_').modal('hide'); 
            

          })
          return
        */
        }
      });//autocomplete

  
}//// hasCustID()
///////////////////////////////////
function delPayment(tr, tableRow, page){
  console.log('in modal-footer delete')
  var pymt=$('#no_custID_ div.modal-header h4.modal-title').text()
  console.log('pymt====='+pymt+' ?')
  var result=confirm('DELETE '+pymt)
  console.log('tr==='+tr+'  paymentID=='+tr.id)
  console.log('result=='+result)
  if(result){
    alert('deleting pymt::'+tr.id+' '+tr.date+' '+tr.amt+' '+tr.trans)
    $.post('/csv/delete/payment',{recID: tr.id}, function(data){
      console.log('in /csv/delete/payment')
    })
  }
}



//////////////////////////////////////

function csvToMySqlDate(date){
  var month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DD=date.slice(0,2);
  var MM=date.slice(3,6);
  var mm = month.indexOf(MM)+1;
  mm=("0" + mm).slice(-2);
  var YYYY='20'+date.slice(7,9);
  //console.log('DD+MM+YYYY='+DD+'  '+mm+'  '+YYYY);
  //console.log('date='+YYYY+'-'+mm+'-'+DD)
  return YYYY+'-'+mm+'-'+DD;
}

function mySqlToCsv(date){
  var month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DD=date.slice(8,10);
  var MM=date.slice(5,7);
  var mm=parseInt(MM);
  mm=month[mm-1];
  var YYYY=date.slice(2,4);
  //console.log('mySqlToCsv='+YYYY+' '+MM+' '+DD+' month='+mm);
  //console.log('date ++++++'+DD+'-'+mm+'-'+YYYY)
  return DD+'-'+mm+'-'+YYYY;
}
