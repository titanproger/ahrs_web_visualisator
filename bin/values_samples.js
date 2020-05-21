
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

var list =
[

  ["IAS"      ,40,100    ],

  ["TAS"      ,40,100    ],

  ["VS"       ,40,100    , (t) => 110 + Sinusize(GetProgress(t,200), 40)],
  ["GS"       ,40,100    , (t) => 170 + Sinusize(GetProgress(t,200), 40)], // km/h
  ["BARO"     ,40,1000   ],
  ["AIRPRESS" ,40,100    ],
  ["TALT"     ,40,100    ],
  ["ALT"      ,40,100    ],
  //["LAT"      ,40,1000   ],
  //["LONG"     ,40,1000   ],
  ["TRACK"    ,40,1000   , (t) => Head =  Linear(GetProgress(t, 120), 0, 360)],
  ["OAT"      ,40,100    ],
  ["HEAD"     ,40,100    , (t) => Head],
  ["ROLL"     ,40,100    ],
  ["PITCH"    ,40,100    ],
  ["AOA"      ,40,100    ],
  ["VOLT"     ,40,100    ],
  ["CURRNT"   ,40,100    ],
  ["FUELF"    ,40,100    ],
  ["FUELP"    ,40,100    ],
  ["FUELQ1"   ,40,1000   ],
  ["FUELQ2"   ,40,1000   ],
  ["FUELQT"   ,40,1000   ],
  ["MAP1"     ,40,100    ],
  ["TACH1"    ,40,100    ],

  ["EGT1"     ,40,1000   ],
  ["EGT2"     ,40,1000   ],
  ["EGT3"     ,40,1000   ],
  ["EGT4"     ,40,1000   ],

  ["CHT1"     ,40,1000   ],
  ["CHT2"     ,40,1000   ],
  ["CHT3"     ,40,1000   ],
  ["CHT4"     ,40,1000   ],

  ["HOBBS1"   , 1000  , (t) => {
    let date1 = new Date("2019-11-10");
    let now   = new Date();
    return Math.floor( (now.getTime() - date1.getTime()) / 1000  /  3600);
  }],
  ["OILTe"    , 1000  ],
  ["OILPe"    , 100   ],
  ["FTIME"    , 1000  , (t) => {return Math.floor(t/1000);} ],
  ["TIMEZ"    , 1000  , (t) => {return Math.floor(new Date().getTime() / 1000);}],
  ["ANORM"    ,40,100    ],
  ["SLIP"     ,40,100    ],

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