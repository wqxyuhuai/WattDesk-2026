// Preview-only Service Ticket data. These records model products and access
// relationships for the UI, but no API, authentication, upload or notification
// service is connected. All mutations remain in the page's current session.

export const CURRENT_USER=Object.freeze({
  id:"carl",
  name:"Carl Wang",
  initials:"CW",
  role:"service"
});

export const USERS=Object.freeze([
  {id:"carl",name:"Carl Wang",initials:"CW"},
  {id:"kyle",name:"Kyle Daniel",initials:"KD"},
  {id:"james",name:"James Ken",initials:"JK"},
  {id:"david",name:"David Miller",initials:"DM"},
  {id:"maria",name:"Maria Hoffmann",initials:"MH"},
  {id:"nora",name:"Nora Weiss",initials:"NW"}
]);

export const PLANT_ACCESS=Object.freeze({
  p01:["carl","kyle","james","nora"],
  p02:["carl","kyle","james","david"],
  p03:["carl","kyle","maria"],
  p06:["carl","james","nora"],
  p11:["carl","maria","david"],
  p24:["carl","james","nora"],
  p31:["carl","david","nora"],
  p45:["carl","james","maria"]
});

export const SERVICE_TICKETS=Object.freeze([
  {
    id:"st-25638663",
    number:"NO.25638663",
    title:"MPPT charge reduces to zero for no reason",
    body:"I have recently fitted a new device and have a problem that I do not seem to be able to resolve. The unit is fitted with an MPPT250/70 solar. After the latest firmware update the MPPT charge current drops to zero around midday.\n\nThe battery is still below its charge limit and the inverter remains online. Please check whether the charge curve or a protection threshold changed.",
    status:"ongoing",
    plantId:"p02",
    authorId:"kyle",
    createdMinutes:1560,
    updatedMinutes:25,
    mentionedUserIds:["carl"],
    attachments:[
      {id:"a-663-1",kind:"file",name:"inverter-log-2026-10-29.txt",size:"48 KB"},
      {id:"a-663-2",kind:"file",name:"mppt-curve.png",size:"186 KB"}
    ],
    comments:[
      {
        id:"c-663-1",
        authorId:"kyle",
        parentId:null,
        replyToId:null,
        body:"A restart temporarily restores charging, but the issue returns after about 20 minutes.",
        createdMinutes:1420,
        mentionedUserIds:[],
        attachments:[]
      },
      {
        id:"c-663-2",
        authorId:"james",
        parentId:"c-663-1",
        replyToId:"c-663-1",
        body:"@Carl Wang can you compare this with the charge limits in the service log?",
        createdMinutes:940,
        mentionedUserIds:["carl"],
        attachments:[]
      },
      {
        id:"c-663-3",
        authorId:"carl",
        parentId:null,
        replyToId:null,
        body:"I will inspect the MPPT thresholds and check the site history tomorrow morning.",
        createdMinutes:120,
        mentionedUserIds:[],
        attachments:[]
      },
      {
        id:"c-663-4",
        authorId:"kyle",
        parentId:null,
        replyToId:null,
        body:"Thank you. I have also captured the dashboard values while the current is zero.",
        createdMinutes:25,
        mentionedUserIds:[],
        attachments:[{id:"a-c-663-4",kind:"file",name:"dashboard-snapshot.jpg",size:"242 KB"}]
      }
    ]
  },
  {
    id:"st-25638642",
    number:"NO.25638642",
    title:"Inverter reports BMS communication timeout",
    body:"The inverter shows an intermittent BMS communication timeout. The warning clears by itself, but it has appeared three times this week.",
    status:"ongoing",
    plantId:"p01",
    authorId:"carl",
    createdMinutes:720,
    updatedMinutes:48,
    mentionedUserIds:[],
    attachments:[{id:"a-642-1",kind:"file",name:"bms-events.csv",size:"22 KB"}],
    comments:[
      {
        id:"c-642-1",
        authorId:"nora",
        parentId:null,
        replyToId:null,
        body:"The warning aligns with the morning restart window. I will check the shared CAN timing settings.",
        createdMinutes:300,
        mentionedUserIds:[],
        attachments:[]
      },
      {
        id:"c-642-2",
        authorId:"james",
        parentId:"c-642-1",
        replyToId:"c-642-1",
        body:"Please include the battery firmware version with the result.",
        createdMinutes:48,
        mentionedUserIds:[],
        attachments:[]
      }
    ]
  },
  {
    id:"st-25638597",
    number:"NO.25638597",
    title:"Heater output drops after firmware update",
    body:"After updating to V26.16.15.15 the heater output is lower than usual at the same target temperature. No alarm is present.",
    status:"ongoing",
    plantId:"p11",
    authorId:"maria",
    createdMinutes:2900,
    updatedMinutes:95,
    mentionedUserIds:["carl"],
    attachments:[],
    comments:[
      {
        id:"c-597-1",
        authorId:"maria",
        parentId:null,
        replyToId:null,
        body:"@Carl Wang is this expected with the new modulation logic?",
        createdMinutes:2800,
        mentionedUserIds:["carl"],
        attachments:[]
      }
    ]
  },
  {
    id:"st-25638488",
    number:"NO.25638488",
    title:"Request: export monthly fault history",
    body:"It would help if the service team could export the monthly fault history without copying each event manually.",
    status:"ongoing",
    plantId:"p24",
    authorId:"carl",
    createdMinutes:4320,
    updatedMinutes:220,
    mentionedUserIds:[],
    attachments:[],
    comments:[
      {
        id:"c-488-1",
        authorId:"nora",
        parentId:null,
        replyToId:null,
        body:"A CSV export with event time, code and recovery state would cover most of our reporting needs.",
        createdMinutes:220,
        mentionedUserIds:[],
        attachments:[]
      }
    ]
  },
  {
    id:"st-25638172",
    number:"NO.25638172",
    title:"Add commissioning report to the ticket",
    body:"The commissioning report was uploaded after the handover. Please keep it attached to this service record for future visits.",
    status:"closed",
    plantId:"p06",
    authorId:"carl",
    createdMinutes:10080,
    updatedMinutes:2880,
    mentionedUserIds:[],
    attachments:[{id:"a-172-1",kind:"file",name:"commissioning-report.pdf",size:"1.4 MB"}],
    comments:[
      {
        id:"c-172-1",
        authorId:"james",
        parentId:null,
        replyToId:null,
        body:"The report is linked to the site history. I am closing this request now.",
        createdMinutes:2900,
        mentionedUserIds:[],
        attachments:[]
      }
    ]
  },
  {
    id:"st-25637944",
    number:"NO.25637944",
    title:"Grid export limit stays below configured value",
    body:"The export limit remains at 6 kW even though the plant configuration allows 10 kW. This started after a grid-code profile change.",
    status:"closed",
    plantId:"p31",
    authorId:"david",
    createdMinutes:14400,
    updatedMinutes:5760,
    mentionedUserIds:[],
    attachments:[],
    comments:[
      {
        id:"c-944-1",
        authorId:"carl",
        parentId:null,
        replyToId:null,
        body:"The old grid-code profile was still active on the control board. It has been updated and verified.",
        createdMinutes:5800,
        mentionedUserIds:[],
        attachments:[]
      }
    ]
  },
  {
    id:"st-25637716",
    number:"NO.25637716",
    title:"Battery balancing outside expected window",
    body:"Cell balancing starts earlier than the configured overnight window. It is usually complete before 02:00 instead of 04:00.",
    status:"ongoing",
    plantId:"p03",
    authorId:"maria",
    createdMinutes:8640,
    updatedMinutes:510,
    mentionedUserIds:[],
    attachments:[],
    comments:[]
  },
  {
    id:"st-25637408",
    number:"NO.25637408",
    title:"Replace damaged MC4 connector",
    body:"The roof-side positive MC4 connector is visibly discoloured. The plant has been isolated and the replacement is scheduled.",
    status:"closed",
    plantId:"p45",
    authorId:"james",
    createdMinutes:20160,
    updatedMinutes:11520,
    mentionedUserIds:[],
    attachments:[{id:"a-408-1",kind:"file",name:"connector-photo.jpg",size:"318 KB"}],
    comments:[]
  }
]);

export const userById=id=>USERS.find(user=>user.id===id)??{
  id,
  name:"Unknown user",
  initials:"?"
};

export const ticketById=id=>SERVICE_TICKETS.find(ticket=>ticket.id===id)??null;

export const usersWithPlantAccess=plantId=>{
  const ids=new Set(PLANT_ACCESS[plantId]||[]);
  return USERS.filter(user=>ids.has(user.id));
};
