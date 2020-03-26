var express = require('express');
var router = express.Router();
var path = require('path');
var CsvReadableStream = require('csv-reader');
var fs = require('fs');
const mysql=require('mysql');
const connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'stairadmin',
      password: 'ericpass',
      database: 'stairadmin',
      timezone: 'utc'
    });

router.get('/', function(req,res){
  res.render('csv',
          {title: 'csv page'})
})


router.get('/download', function(req,res){
	console.log('in /download');
  console.log('req.query=='+req.query.fileName)
  var inputStream = fs.createReadStream('C:/Users/Rhoda/Downloads/'+req.query.fileName, 'utf8');
  var record=[];
  var data=[];
  //var data='';
  inputStream
    .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        //console.log('A row arrived: ', row[0]+'  '+row[1]+'  '+row[4]);
        //console.log('parseFloat(row[1])'+parseFloat(row[1]))
        if(parseFloat(row[1])>0 && row[4]!='Mobile Banking MOB' 
          && row[2]!="" && row[4].match(/\d{8}/)){
          //console.log('greater than zero')
        data.push([row[0],row[1],row[4],row[4].match(/\d{8}/)[0].slice(0,4)]);
        //console.log('name+++++'+row[4].match(/,\D*/)[0])
        /*
          only push to data if row[1] (amount)>0 no debits
                                row[4] isn't Branch CREDIT (cheques paid in)
                                drop row[2] (balance) and row[3] (currency)
        */
        
        }//if
        else if(parseFloat(row[1])>0 && row[4]!='Mobile Banking MOB' 
          && row[2]!=""){
          data.push([row[0],row[1],row[4],0]);
           }
       /*
        This gives: data[i][0]=tdate
                    data[i][1]=amt
                    data[i][2]=trans
                    data[i][3]=custID or 0 (if there is none)
       */

       // console.log('data+++++'+data)
    })
    .on('end', function () {
      //  console.log('No more rows!');
        console.log('data===='+csvToMySqlDate(data[1][0])+
          ' '+data[1][1]+' '+data[1][2]);
        
        res.send(data);

    });
  
  //res.end();
})

///////////////////////////////////////////////
router.post('/append',function(req,res){
  console.log('in /append')
  console.log('req.body'+req.body.paydata)
var pay=JSON.parse(req.body.paydata);
console.log('pay[0][0]='+pay[0].date+'    pay[0][1]='+pay[0].amt+
  '    pay[0][2]='+pay[0].trans+'  pay[0][3]=='+pay[0].custID)
console.log('pay.length====='+pay.length)
var qry=[];
for(var i=0; i<pay.length; i++){
        if(pay[i].date){
        var set_qry="SET @date= STR_TO_DATE("+"'"+pay[i].date+"','%d-%b-%y');";
        console.log('set_qry=='+set_qry)
        var insert_qry="INSERT INTO temp (custID, tdate, amt, trans)"+
                " SELECT "+pay[i].custID+", STR_TO_DATE('"+pay[i].date+"','%d-%b-%y'), "
                +pay[i].amt+", '"+pay[i].trans+"'"+
                " WHERE NOT EXISTS"+
                " (SELECT * FROM payments"+
                " WHERE (to_days(tdate) BETWEEN to_days(@date)-3"+
                " AND to_days(@date)+3"+
                " AND amt="+pay[i].amt+
                " AND trans LIKE "+"'"+pay[i].trans+"'"+"));";
                //" AND trans LIKE "+"'%"+pay[i][2]+"%'"+"));";
                //" AND trans= "+"//'"+pay[i][2]+"'"+"));";
       //console.log('insert_qry='+insert_qry);
       qry.push([insert_qry,i,set_qry]);
       /*
       qry is an array of array
       qry[i][0]= the insert qry which inserts to temp if custID
       and amt matches AND csv payment date (@date) is between
       3 days after and 1 day before tdate (the db value)
       qry[i][1] is the row value of the csv download
       qry[i][2] is the set_qry which sets the value of @date to the 
       csv value.
       */
       }//if
    }//for
    console.log('array qry=='+qry+'   qry[0]='+qry[0])
    console.log('qry.length=='+qry.length)
    console.log('qry[0][0]='+qry[0][0])
    var rec_added=[];
   insertRec(pay,qry,rec_added,res);
})

function insertRec(pay,arr,rec_added,res){
  console.log('in insertRec')
      connection.query('TRUNCATE temp;', function(err, result){
        if(err) throw err;
      });
  var row=[]
  for(var k=0;k<arr.length;k++){row.push(arr[k][1])}
  for(var j=0; j<arr.length; j++){
   
    var counter=0
//////////////////////////////////////////////////////////
        connection.query(arr[j][2],function(err,rows){
          if(err) throw err;
          //res.send(rows)
        });
///////////////////////////////////////////////////////////
       connection.query(arr[j][0], [row[counter]], function(err,result,fields){
          if(err) throw err;
             
              if(result.insertId!=0){
                  rec_added.push([result.insertId, 
                  pay[row[counter]].date, pay[row[counter]].amt, pay[row[counter]].trans,
                  pay[row[counter]].custID])
              }
                if(counter==arr.length-1){
                console.log('rec_added in conn=='+rec_added+
                  'numer of records added= '+rec_added.length)
                //return callback(rec_added)
                res.send(rec_added)
                }
            counter++;   
           });//connection
  }//for
}


router.get('/search',function(req,res){
	console.log('in search');
	console.log('name='+req.query.str);
	var name=req.query.str;
     var qry5='select  DATE_FORMAT(tdate,"%d-%b-%y") AS tdat, custID, amt, trans from payments'+
      ' where (trans like "%'+name+'%" ) limit 4;';
      console.log('val....   qry5 ..... '+ qry5);

      
      connection.query(qry5, function(err,rows){
          if(err) throw err;
           // console.log('Data received from Db:\n');
           // console.log('the variable rows====',rows);
                rows.forEach( (row) => { 
             //     console.log(`${row.name} is in ${row.email} and ${row.prop}`); 
                });//for each
                //res.send('custID='+custID+'   '+JSON.stringify(rows)+
                //	'       '+rows[0].name);
                res.send(rows)
            });//connection
     
     // res.end('end res')
})
/////////////////////////////////////////
router.get('/display', function(req, res){
  console.log('in display')
  console.log('custID='+req.query.custID);
  var custID=parseInt(req.query.custID);
  var qry='select c.name, c.id, p.prop from customers'+
      ' as c '+
      ' inner join properties as p on c.property_id=p.id'+
      ' where (c.id='+custID+');';
      console.log('val....   qry5 ..... '+ qry);
      connection.query(qry, function(err,rows){
          if(err) throw err;
           // console.log('Data received from Db:\n');
           // console.log('the variable rows====',rows);
                rows.forEach( (row) => { 
             //     console.log(`${row.name} is in ${row.email} and ${row.prop}`); 
                });//for each
                //res.send('custID='+custID+'   '+JSON.stringify(rows)+
                //  '       '+rows[0].name);
                res.send(rows)
            });//connection
  //res.send('hello');
})
/////////////////////////////////////
router.post('/update', function(req,res){
	console.log('in update');
	console.log('req.body'+req.body.custID);
  console.log('req.body record'+req.body.rec);
	var record=parseInt(req.body.rec);
  var custID=parseInt(req.body.custID);
	var sql='UPDATE temp '+
			' SET custID='+custID+
      ' WHERE id= '+record+';';
	console.log('sql payment==='+sql);
	
	connection.query(sql, (err,result) => {
				if(err) throw err;
					console.log('Data saved to payments:\n');
			  		console.log('the variable result====',result);
			  		res.send(result);
			}); 
	
	//res.send(req.body)
})

router.get('/refresh', function(req, res){
  console.log('in refresh')
  console.log('first rec=='+req.query.rec1)
  var sql='SELECT id, custID, DATE_FORMAT(tdate,"%d-%b-%y") AS date, amt, trans from temp'+
          ' WHERE (id>='+parseInt(req.query.rec1)+');';
          console.log('sql===='+sql)
      connection.query(sql, function(err,rows){
          if(err) throw err;
           // console.log('Data received from Db:\n');
           // console.log('the variable rows====',rows);
                rows.forEach( (row) => { 
             //     console.log(`${row.name} is in ${row.email} and ${row.prop}`); 
                });//for each
                //res.send('custID='+custID+'   '+JSON.stringify(rows)+
                //  '       '+rows[0].name);
                res.send(rows)
            });//connection
  //res.end()
})

router.get('/autocomplete',function(req,res){
	console.log('in autocomplete');
	console.log('req.query='+req.query.term);
  if(req.query.term.match(/\d/)){
    var name=req.query.term;
     var qry='select c.name, c.id, p.prop from customers'+
      ' as c '+
      ' inner join properties as p on c.property_id=p.id'+
      ' where (p.prop like "'+name+'%");';
      console.log('val....   qry5 ..... '+ qry);
    }
  else{
    //console.log('term is a name  '+req.query.term.match(/\D*/))
    var name=req.query.term;
    var qry='select name, id from customers '+
             'where (name like "%'+name+'%");'
             console.log('name qry===='+qry);
      }	
   
      connection.query(qry, function(err,rows){
          if(err) throw err;
            
                rows.forEach( (row) => {  
                });//for each
                
                res.send(rows)
            });//connection
     
      //res.end('end res')

})

router.post('/tempToPay',function(req, res){
console.log('in /tempToPay')
var sql='INSERT INTO payments(custID, tdate, amt, trans)'+
          ' SELECT custID, tdate, amt, trans'+
          ' FROM temp; ';
console.log('qry=='+sql)
connection.query(sql, (err,result) => {
        if(err) throw err;
          console.log('Data saved to payments:\n');
            console.log('the variable result====',result);
            res.send(result);
      });
//res.end()
})
//////////////////////////////////
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
/////////////////////////////
router.post('/append_1',function(req,res){
  console.log('in /append_1')
  console.log('req.body'+req.body.paydata)
var pay=JSON.parse(req.body.paydata);
console.log('pay[0][0]='+pay[0].date+'    pay[0][1]='+pay[0].amt+
  '    pay[0][2]='+pay[0].trans+'  pay[0][3]=='+pay[0].custID)
console.log('pay.length====='+pay.length)
var qry=[];
for(var i=0; i<pay.length; i++){
        if(pay[i].date){
        
        var insert_qry="INSERT INTO temp (custID, tdate, amt, trans)"+
                " SELECT "+pay[i].custID+", STR_TO_DATE('"+pay[i].date+"','%d-%b-%y'), "
                +pay[i].amt+", '"+pay[i].trans+"'"+
                " WHERE NOT EXISTS"+
                " (SELECT * FROM payments"+
                " WHERE (tdate=STR_TO_DATE('"+pay[i].date+"','%d-%b-%y')"+
                " AND amt="+pay[i].amt+
                " AND trans LIKE "+"'"+pay[i].trans+"'"+"));";
                //" AND trans LIKE "+"'%"+pay[i][2]+"%'"+"));";
                //" AND trans= "+"//'"+pay[i][2]+"'"+"));";
       //console.log('insert_qry='+insert_qry);
       qry.push([insert_qry,i]);
       /*
       qry is an array of array
       qry[i][0]= the insert qry which inserts to temp if custID
       and amt matches AND csv payment date (@date) is between
       3 days after and 1 day before tdate (the db value)
       qry[i][1] is the row value of the csv download
       qry[i][2] is the set_qry which sets the value of @date to the 
       csv value.
       */
       }//if
    }//for
    console.log('array qry=='+qry+'   qry[0]='+qry[0])
    console.log('qry.length=='+qry.length)
    console.log('qry[0][0]='+qry[0][0])
    var rec_added=[];
   insertRec_1(pay,qry,rec_added,res);
})

function insertRec_1(pay,arr,rec_added,res){
  console.log('in insertRec')
      connection.query('TRUNCATE temp;', function(err, result){
        if(err) throw err;
      });
  var row=[]
  for(var k=0;k<arr.length;k++){row.push(arr[k][1])}
  for(var j=0; j<arr.length; j++){
   
    var counter=0
//////////////////////////////////////////////////////////
      
///////////////////////////////////////////////////////////
       connection.query(arr[j][0], [row[counter]], function(err,result,fields){
          if(err) throw err;
             
              if(result.insertId!=0){
                  rec_added.push([result.insertId, 
                  pay[row[counter]].date, pay[row[counter]].amt, pay[row[counter]].trans,
                  pay[row[counter]].custID])
              }
                if(counter==arr.length-1){
                console.log('rec_added in conn=='+rec_added+
                  'numer of records added= '+rec_added.length)
                //return callback(rec_added)
                res.send(rec_added)
                }
            counter++;   
           });//connection
  }//for
}

router.post('/insert/payment',function(req,res){
console.log('in /insert/payment')
console.log('req.body==='+req.body.formData)
console.log('req.body parsed==='+JSON.parse(req.body.formData))
console.log('req.body parsed addr==='+JSON.parse(req.body.formData)[1].value)
var name=JSON.parse(req.body.formData)[0].value
var addr=JSON.parse(req.body.formData)[1].value
var date=JSON.parse(req.body.formData)[2].value
var amt=JSON.parse(req.body.formData)[3].value
var payType=JSON.parse(req.body.formData)[4].value
var custID=JSON.parse(req.body.formData)[5].value
var trans='"'+payType+'  '+name+'"'

var sql='INSERT INTO payments (custID, tdate, amt, trans)'+
        ' VALUES ('+custID+', STR_TO_DATE('+'"'+date+'"'+','+'"%Y-%m-%d"'+'), '+amt+', '+trans+');';
console.log('sql===='+sql)
connection.query(sql, (err,result) => {
        if(err) throw err;
          console.log('Data saved to payments:\n');
            console.log('the variable result====',result);
            res.send(result);
      });////connection
//res.end();

})

router.post('/delete/payment',function(req,res){
  console.log('in /delete/payment')
  console.log('req.body==='+req.body.recID)
  var sql='DELETE from payments WHERE id='+req.body.recID+';';
  console.log('sql===='+sql)
  connection.query(sql, (err,result) => {
        if(err) throw err;
          console.log('record deleted from payments:\n');
            console.log('the variable result====',result);
            res.send(result);
      });////connection

//  res.end();
})

module.exports = router;