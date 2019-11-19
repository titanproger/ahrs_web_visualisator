
var list =
[

  ["IAS"      ,100    ],

  ["TAS"      ,100    ],

  ["VS"       ,100    ],
  ["GS"       ,100    ],
  ["BARO"     ,1000   ],
  ["AIRPRESS" ,100    ],
  ["ALT"      ,100    ],
  ["TALT"     ,100    ],
  ["LAT"      ,1000   ],
  ["LONG"     ,1000   ],
  ["TRACK"    ,1000   ],
  ["OAT"      ,100    ],
  ["HEAD"     ,100    ],
  ["ROLL"     ,100    ],
  ["PITCH"    ,100    ],
  ["AOA"      ,100    ],
  ["VOLT"     ,100    ],
  ["CURRNT"   ,100    ],
  ["FUELF"    ,100    ],
  ["FUELP"    ,100    ],
  ["FUELQ1"   ,1000   ],
  ["FUELQ2"   ,1000   ],
  ["FUELQT"   ,1000   ],
  ["MAP1"     ,100    ],
  ["TACH1"    ,100    ],

  ["EGT1"     ,1000   ],
  ["EGT2"     ,1000   ],
  ["EGT3"     ,1000   ],
  ["EGT4"     ,1000   ],

  ["CHT1"     ,1000   ],
  ["CHT2"     ,1000   ],
  ["CHT3"     ,1000   ],
  ["CHT4"     ,1000   ],

  ["HOBBS1"   , 1000  , (t) => {
    let date1 = new Date("2019-11-10");
    let now   = new Date();
    return Math.floor( (now.getTime() - date1.getTime()) / 1000  /  3600);
  }],
  ["OILTe"    , 1000  ],
  ["OILPe"    , 100   ],
  ["FTIME"    , 1000  , (t) => {return Math.floor(t/1000);} ],
  ["TIMEZ"    , 1000  , (t) => {return Math.floor(new Date().getTime() / 1000);}],
  ["ANORM"    ,100    ],
  ["SLIP"     ,100    ],

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