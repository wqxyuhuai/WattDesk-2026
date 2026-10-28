// Preview-only sample data for the Plants list.
// No backend, permission model or detail route is connected. Names, SNs and
// firmware versions mirror the annotated design boards; timestamps are derived
// from load time so "last update" stays readable, and every row is illustrative.

// Connection and health are different questions on the redesigned list:
// connection is icon-only, while health keeps its label. Both derive from the
// same per-plant state so the sample data cannot contradict itself.
export const STATUS_META=Object.freeze({
 attention:{label:"Attention",tone:"orange",severity:0,connection:"online"},
 offline:{label:"Offline",tone:"red",severity:1,connection:"offline"},
 partially_offline:{label:"Partially offline",tone:"yellow",severity:2,connection:"partial"},
 unbound:{label:"Unbound device",tone:"neutral",severity:3,connection:"unbound"},
 normal:{label:"Normal",tone:"green",severity:4,connection:"online"}
});

export const CONNECTION_META=Object.freeze({
 online:{label:"Online"},
 offline:{label:"Offline"},
 partial:{label:"Partially online"},
 unbound:{label:"Unbound"}
});

// The list's Status column deliberately shows three health outcomes. Offline
// and partially offline plants still need attention, so they share the red
// Attention state while their connection icon preserves the distinction.
export const HEALTH_META=Object.freeze({
 attention:{label:"Attention",tone:"red",severity:0,icon:"asset-64.svg"},
 unbound:{label:"Unbound device",tone:"neutral",severity:1,icon:"asset-34.svg"},
 normal:{label:"Normal",tone:"green",severity:2,icon:"tickle.svg"}
});

// Worst first, so the unfiltered "Status" sort opens on what needs work.
export const STATUS_ORDER=Object.freeze(["attention","offline","partially_offline","unbound","normal"]);

export const COMPANIES=Object.freeze([
 {id:"wattsonic",label:"Wattsonic Energy Technology"},
 {id:"fe",label:"FE Energiesysteme GmbH (AC)"},
 {id:"bischoff",label:"Bischoff Energiesysteme GmbH"},
 {id:"winkler",label:"Elektro-Service Winkler"},
 {id:"ekd",label:"Energiekonzepte Deutschland GmbH"},
 {id:"ksw",label:"KSW Handwerks GmbH"}
]);

export const PLANT_TYPES=Object.freeze([
 {id:"heating",label:"Heating system"},
 {id:"battery",label:"Battery system"},
 {id:"hybrid",label:"Hybrid system"}
]);

export const DEVICES=Object.freeze([
 {id:"bms",label:"BMS & Battery"},
 {id:"heater",label:"Heater"},
 {id:"inverter",label:"Hybrid Inverter"}
]);

// powerSigned mirrors the board note: BMS power is signed (charging +,
// discharging -), heater power is never signed. name:"" means the device came
// online without a plant and the plant creation is still pending, so the list
// shows "?" plus the explanatory tooltip.
function make(tail){
 return `WSAUTSM382R22460${tail}`;
}

export const PLANTS=Object.freeze([
 {id:"p01",name:"EKD Showroom",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100101"),type:"heating",device:"bms",powerKw:3.5,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:120},
 {id:"p02",name:"Silvio Bräuer",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100102"),type:"heating",device:"bms",powerKw:12.2,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:15},
 {id:"p03",name:"Lipovec",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100103"),type:"heating",device:"bms",powerKw:2.5,powerSigned:true,status:"attention",firmware:"V450.105",updatedMinutes:1500},
 {id:"p04",name:"Roy Neubauer 167228",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100104"),type:"battery",device:"bms",powerKw:0,powerSigned:true,status:"partially_offline",firmware:"V440.104",updatedMinutes:120},
 {id:"p05",name:"Weißfinger Winfried und Ines 164…",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100105"),type:"hybrid",device:"inverter",powerKw:-2.5,powerSigned:true,status:"offline",firmware:"V440.104",updatedMinutes:15},
 {id:"p06",name:"Jürgen Dutschke",companyId:"ksw",installer:"KSW Handwerks GmbH",sn:make("100106"),type:"heating",device:"bms",powerKw:-8.3,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:75},
 {id:"p07",name:"Sabrina Menze-Kröll",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100107"),type:"heating",device:"bms",powerKw:null,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:120},
 {id:"p08",name:"Erika Kuhles 165208",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100108"),type:"heating",device:"bms",powerKw:12.3,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:15},
 {id:"p09",name:"Siegfried Kunze 164900",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100109"),type:"heating",device:"heater",powerKw:3.5,powerSigned:false,status:"normal",firmware:"V26.16.15.15",updatedMinutes:1500},
 {id:"p10",name:"Piehl",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100110"),type:"heating",device:"bms",powerKw:12.2,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:120},
 {id:"p11",name:"Andreas Becker",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100111"),type:"heating",device:"heater",powerKw:2.5,powerSigned:false,status:"attention",firmware:"V26.16.15.15",updatedMinutes:15},
 {id:"p12",name:"Frank Schönthaler 168314",companyId:"ksw",installer:"KSW Handwerks GmbH",sn:make("100112"),type:"heating",device:"bms",powerKw:0,powerSigned:true,status:"attention",firmware:"V440.104",updatedMinutes:1500},
 {id:"p13",name:"Dr. Heinz-Dethart Froelich",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100113"),type:"battery",device:"bms",powerKw:-2.5,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:1290},
 {id:"p14",name:"Andrea Dumke 158321",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100114"),type:"heating",device:"bms",powerKw:-8.3,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:1800},
 {id:"p15",name:"Harald Görner 105663",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100115"),type:"heating",device:"bms",powerKw:null,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:120},
 {id:"p16",name:"Rainer und Gabriele Fiert",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100116"),type:"heating",device:"heater",powerKw:12.3,powerSigned:false,status:"normal",firmware:"V26.16.15.15",updatedMinutes:1300},
 {id:"p17",name:"René Metze 78257",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100117"),type:"heating",device:"bms",powerKw:12.2,powerSigned:true,status:"offline",firmware:"V440.104",updatedMinutes:1800},
 {id:"p18",name:"Uwe Keller 169737",companyId:"ksw",installer:"KSW Handwerks GmbH",sn:make("100118"),type:"heating",device:"bms",powerKw:2.5,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:1440},
 {id:"p19",name:"Alexander",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100119"),type:"hybrid",device:"inverter",powerKw:0,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:120},
 {id:"p20",name:"Gravelius - 97334",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100120"),type:"heating",device:"bms",powerKw:-2.9,powerSigned:true,status:"attention",firmware:"V26.16.15.15",updatedMinutes:15},
 {id:"p21",name:"",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100121"),type:"heating",device:"bms",powerKw:12.2,powerSigned:true,status:"unbound",firmware:null,updatedMinutes:15},
 {id:"p22",name:"",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100122"),type:"heating",device:"heater",powerKw:0,powerSigned:false,status:"unbound",firmware:null,updatedMinutes:120},
 {id:"p23",name:"",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100123"),type:"battery",device:"bms",powerKw:null,powerSigned:true,status:"unbound",firmware:null,updatedMinutes:1500},
 {id:"p24",name:"Haus am Park",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100124"),type:"battery",device:"bms",powerKw:4.8,powerSigned:true,status:"partially_offline",firmware:"V450.105",updatedMinutes:45},
 {id:"p25",name:"Wärmeverbund Nord",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100125"),type:"hybrid",device:"inverter",powerKw:21.4,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:5},
 {id:"p26",name:"Villa Sonnenhof",companyId:"ksw",installer:"KSW Handwerks GmbH",sn:make("100126"),type:"heating",device:"bms",powerKw:-5.6,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:300},
 {id:"p27",name:"Sonnenhof West",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100127"),type:"battery",device:"bms",powerKw:6.8,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:30},
 {id:"p28",name:"Müller Energietechnik 176502",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100128"),type:"heating",device:"heater",powerKw:4.2,powerSigned:false,status:"attention",firmware:"V440.104",updatedMinutes:80},
 {id:"p29",name:"An der alten Mühle",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100129"),type:"hybrid",device:"inverter",powerKw:18.7,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:210},
 {id:"p30",name:"Thomas Hartmann 118904",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100130"),type:"heating",device:"bms",powerKw:-3.4,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:360},
 {id:"p31",name:"Kraftwerk am See",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100131"),type:"hybrid",device:"inverter",powerKw:24.6,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:20},
 {id:"p32",name:"Familie Lindner 150871",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100132"),type:"heating",device:"bms",powerKw:7.1,powerSigned:true,status:"attention",firmware:"V440.104",updatedMinutes:95},
 {id:"p33",name:"Gutshof Waltersdorf",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100133"),type:"battery",device:"bms",powerKw:9.6,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:240},
 {id:"p34",name:"Solarpark Lindenau",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100134"),type:"hybrid",device:"inverter",powerKw:31.2,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:10},
 {id:"p35",name:"Michaela Seidel 159302",companyId:"ksw",installer:"KSW Handwerks GmbH",sn:make("100135"),type:"heating",device:"heater",powerKw:5.3,powerSigned:false,status:"attention",firmware:"V440.104",updatedMinutes:140},
 {id:"p36",name:"Wohnpark Rosengarten",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100136"),type:"hybrid",device:"inverter",powerKw:15.9,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:420},
 {id:"p37",name:"Christian Vogel 171045",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100137"),type:"heating",device:"bms",powerKw:-1.8,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:55},
 {id:"p38",name:"Scheune & Speicher 12",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100138"),type:"battery",device:"bms",powerKw:8.4,powerSigned:true,status:"attention",firmware:"V26.16.15.15",updatedMinutes:180},
 {id:"p39",name:"Hofgut Eichenberg",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100139"),type:"hybrid",device:"inverter",powerKw:27.3,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:35},
 {id:"p40",name:"Peter Lang 164771",companyId:"wattsonic",installer:"KSW Handwerks GmbH",sn:make("100140"),type:"heating",device:"bms",powerKw:3.7,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:260},
 {id:"p41",name:"",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100141"),type:"battery",device:"bms",powerKw:null,powerSigned:true,status:"unbound",firmware:null,updatedMinutes:40},
 {id:"p42",name:"Blaupunkt Wohnbau 118332",companyId:"ekd",installer:"Energiekonzepte Deutschland GmbH",sn:make("100142"),type:"battery",device:"bms",powerKw:11.5,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:70},
 {id:"p43",name:"Klosterblick 9",companyId:"ksw",installer:"KSW Handwerks GmbH",sn:make("100143"),type:"heating",device:"heater",powerKw:6.1,powerSigned:false,status:"attention",firmware:"V440.104",updatedMinutes:110},
 {id:"p44",name:"Bioenergie Feldrain",companyId:"fe",installer:"FE Energiesysteme GmbH (AC)",sn:make("100144"),type:"hybrid",device:"inverter",powerKw:19.8,powerSigned:true,status:"normal",firmware:"V450.105",updatedMinutes:330},
 {id:"p45",name:"Katarina Pohl 152604",companyId:"bischoff",installer:"Bischoff Energiesysteme GmbH",sn:make("100145"),type:"battery",device:"bms",powerKw:7.9,powerSigned:true,status:"normal",firmware:"V440.104",updatedMinutes:45},
 {id:"p46",name:"Sonnengarten Pankow",companyId:"winkler",installer:"Elektro-Service Winkler",sn:make("100146"),type:"hybrid",device:"inverter",powerKw:22.1,powerSigned:true,status:"normal",firmware:"V26.16.15.15",updatedMinutes:480}
]);

export const UNASSIGNED_TOOLTIP =
 "This device is not currently associated with any plant. Please proceed with the setup.";

// Distributor / installer metadata is not a table column; it exists so the
// search can reach the same organisations the design boards list. Sample data
// derives it from the operating company instead of inventing a second relation.
const DISTRIBUTOR_BY_COMPANY={
 wattsonic:"Wattsonic Technology",
 fe:"FE Distribution GmbH",
 bischoff:"Bischoff Energy Distribution",
 winkler:"Winkler Handel GmbH",
 ekd:"EKD Vertrieb GmbH",
 ksw:"KSW Distribution"
};

export const companyLabel=id=>COMPANIES.find(company=>company.id===id)?.label??id;
export const typeLabel=id=>PLANT_TYPES.find(type=>type.id===id)?.label??id;
export const deviceLabel=id=>DEVICES.find(device=>device.id===id)?.label??id;
export const distributorLabel=id=>DISTRIBUTOR_BY_COMPANY[id]??"";
// Stable route lookup for `/plants/:id`. The ID is part of the URL contract;
// changing a demo plant's id must be treated as a URL change.
export const plantById=id=>PLANTS.find(plant=>plant.id===id)??null;
