


При соединении от сервера приходят события "valueBundle" и множество "value"


#От сервера:
##########################
value

Значение изменено

name: "value",
payload: {code:"VARNAME", value: "23234"}

Пример
    socket.on('value', function(msg){
        onValue(msg.code, msg.value)
    });

##########################
valueDel

Значение удалено


name: "valueDel",
payload: {code:"VARNAME"}


##########################
valueBundle

Массив знaчений изменны

name: "valueBundle",
payload: {
    values: [
        {code:"VARNAME1", value: "23234123"},
        {code:"VARNAME2", value: "23234234"}
    ]       
}


#От клиента:
##########################
valueSet

Изменить или создать переменную


name: "valueSet",
payload: {code:"VARNAME", value:"VAlue", ttl: 13}

ttl - время жизни до удаления


Пример:
    socket.emit( "valueSet" , {
        code: code,
        value: value,
        ttl: ttl
    });

##########################
valueSetBundle


name: "valueSetBundle",
payload: {
    values: [
        {code:"VARNAME", value:"Value", ttl: 13}, 
        ... , 
        {code:"VARNAME", value:"Value", ttl: 1} 
    ]
}

Пример:

socket.emit( "valueSetBundle" , {
    values: [
        {
            code: code,
            value: value,
            ttl: ttl
        },
        {
            code: code+"2",
            value: value+"2",
            ttl: ttl
        },                
    ]            
});