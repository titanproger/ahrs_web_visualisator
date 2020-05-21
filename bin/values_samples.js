
function GetProgress(t,  period, offset = 0) {
  return (( t / 1000) + offset) % period / period;
}

function Sinusize( progress , amplitude = 1) {
  return Math.sin( progress * Math.PI * 2) * amplitude
}

function Linear ( progress , offset, amplitude ) {
  return offset + progress * amplitude
}

var Head = 0;


let EGT_FUNC = function(id) { 
    return (t) => 120 + Sinusize(GetProgress(t+id,20 - id), 40) 
}

let CHT_FUNC = function(id) { 
    return (t) => 80 + Sinusize(GetProgress(t+id,20 - id), 30) 
}

var list =
[

  ["IAS"      ,40,100    , (t) => 70 + Sinusize(GetProgress(t,70), 70),],

  ["TAS"      ,40,100    , (t) => 60 + Sinusize(GetProgress(t,70), 60),],

  ["VS"       ,40,100    , (t) => 110 + Sinusize(GetProgress(t,200), 40)], //vario
  ["GS"       ,40,100    , (t) => 170 + Sinusize(GetProgress(t,200), 40)], // km/h
  ["BARO"     ,40,1000   ],
  ["AIRPRESS" ,40,100    ],
  ["TALT"     ,40,100    , (t) => 2200 + Sinusize(GetProgress(t,200), 2000),],
  ["ALT"      ,40,100    , (t) => 2000 + Sinusize(GetProgress(t,200), 2000),],
  //["LAT"      ,40,1000   ],
  //["LONG"     ,40,1000   ],
  ["TRACK"    ,40,1000   , (t) => Head =  Linear(GetProgress(t, 120), 0, 360)],
  ["OAT"      ,40,100    ],
  ["HEAD"     ,40,100    , (t) => Head],
  ["ROLL"     ,40,100    ],
  ["PITCH"    ,40,100    ],
  ["AOA"      ,40,100    ],
  ["VOLT"     ,40,100    , (t) => 13 + Sinusize(GetProgress(t,20), 1.5), ],
  ["CURRNT"   ,40,100    , (t) => 0 + Sinusize(GetProgress(t,20), 4), ],
  ["FUELF"    ,40,100    ],
  ["FUELP"    ,40,100    ],
  ["FUELQ1"   ,40,1000   , (t) => 25 + Sinusize(GetProgress(t,100), 25) ],
  ["FUELQ2"   ,40,1000   , (t) => 25 + Sinusize(GetProgress(t+10,90), 25)],
  ["FUELQT"   ,40,1000   ],
  ["MAP1"     ,40,100    ],
  ["TACH1"    ,40,100    ,(t) => 2000 + Sinusize(GetProgress(t,20), 2000),],

  ["EGT1"     ,40,1000   ,EGT_FUNC(1)],
  ["EGT2"     ,40,1000   ,EGT_FUNC(2)],
  ["EGT3"     ,40,1000   ,EGT_FUNC(3)],
  ["EGT4"     ,40,1000   ,EGT_FUNC(4)],

  ["CHT1"     ,40,1000   ,CHT_FUNC(1)],
  ["CHT2"     ,40,1000   ,CHT_FUNC(2)],
  ["CHT3"     ,40,1000   ,CHT_FUNC(3)],
  ["CHT4"     ,40,1000   ,CHT_FUNC(4)],

  ["HOBBS1"   , 1000  , (t) => {
    let date1 = new Date("2019-11-10");
    let now   = new Date();
    return Math.floor( (now.getTime() - date1.getTime()) / 1000  /  3600);
  }],
  ["OILTe"    , 1000  ,CHT_FUNC(5)],
  ["OILPe"    , 100   ,(t) => 3 + Sinusize(GetProgress(t,10), 3),],
  ["FTIME"    , 1000  , (t) => {return Math.floor(t/1000);} ],
  ["TIMEZ"    , 1000  , (t) => {return Math.floor(new Date().getTime() / 1000);}],
  ["ANORM"    ,40,100 ,(t) => 2 + Sinusize(GetProgress(t,30), 2),],
  ["SLIP"     ,40,100 ,(t) => 0 + Sinusize(GetProgress(t,10), 1),],

  ["NEXTWPT"    ,0    ],
  ["NEXTCOURSE" ,0    ],
  ["NEXTLAT"    ,0    ],
  ["NEXTLONG"   ,0    ],
  ["NEXTDECL"   ,0    ],
  ["DISTANCE"   ,0    ],
  ["BEARING"    ,0    ],
  ["DEVIATION"  ,0    ],

  ["SSKYWPT"    ,0    ],
  ["SSKYCOURSE" ,0    ],
  ["SSKYLAT"    ,0    ],
  ["SSKYLONG"   ,0    ],
  ["SSKYDECL"   ,0    ],
  ["SSKYUSED"   ,0    ]
];

module.exports = list;