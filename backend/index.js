import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 4000);
const businesses = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/businesses.json'), 'utf8'));
const areas = [
 {name:'Indiranagar',lat:12.9719,lng:77.6412,demand:82,affordability:49,accessibility:86,growth:78,monthlyRent:48000,avgSpend:260},
 {name:'Koramangala',lat:12.9352,lng:77.6245,demand:88,affordability:43,accessibility:82,growth:84,monthlyRent:52000,avgSpend:280},
 {name:'Jayanagar',lat:12.9200,lng:77.5930,demand:76,affordability:62,accessibility:79,growth:68,monthlyRent:35000,avgSpend:220},
 {name:'Malleshwaram',lat:13.0000,lng:77.5700,demand:70,affordability:67,accessibility:77,growth:61,monthlyRent:31000,avgSpend:200},
 {name:'MG Road',lat:12.9750,lng:77.6050,demand:91,affordability:35,accessibility:93,growth:73,monthlyRent:68000,avgSpend:340},
 {name:'BTM Layout',lat:12.9166,lng:77.6101,demand:80,affordability:72,accessibility:75,growth:80,monthlyRent:28000,avgSpend:190},
 {name:'Rajajinagar',lat:12.9870,lng:77.5550,demand:67,affordability:70,accessibility:74,growth:59,monthlyRent:29000,avgSpend:180}
];
const categoryDemand = {Cafe:78,Bakery:69,Grocery:84,Pharmacy:72,Restaurant:81};
const categoryColors = {Cafe:'#d97757',Bakery:'#d9a441',Grocery:'#2f9e78',Pharmacy:'#5b83d5',Restaurant:'#8b70c9'};
function haversineKm(a,b){const R=6371,toRad=x=>x*Math.PI/180;const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);const h=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
function clamp(v,min=0,max=100){return Math.max(min,Math.min(max,v));}
function buildAnalysis(category='Cafe', weights={demand:0.35,competition:0.25,affordability:0.2,accessibility:0.12,growth:0.08}){
 const defaults={demand:0.35,competition:0.25,affordability:0.20,accessibility:0.12,growth:0.08};
 const supplied=Object.fromEntries(Object.keys(defaults).map(k=>[k,Number(weights?.[k]??defaults[k])]));
 const total=Object.values(supplied).reduce((sum,value)=>sum+value,0);
 const effective=total>0?supplied:defaults;
 const wsum=Object.values(effective).reduce((sum,value)=>sum+value,0);
 const normalized=Object.fromEntries(Object.entries(effective).map(([k,v])=>[k,v/wsum]));
 const catBiz=businesses.filter(b=>b.category===category);
 const results=areas.map(area=>{
   const nearby=businesses.filter(b=>haversineKm(area,{lat:b.lat,lng:b.lng})<=1.25);
   const localCat=nearby.filter(b=>b.category===category).length;
   const localAll=nearby.length;
   const demand=clamp((categoryDemand[category]||70)*0.58+area.demand*0.42);
   const competition=clamp(100-(localCat*15));
   const affordability=area.affordability;
   const accessibility=area.accessibility;
   const growth=area.growth;
   const score=Math.round(demand*normalized.demand+competition*normalized.competition+affordability*normalized.affordability+accessibility*normalized.accessibility+growth*normalized.growth);
   const confidence=clamp(35+localAll*2+catBiz.length,35,68);
   return {...area,category,score,confidence,dataQuality:{status:'illustrative_demo',source:'Bundled synthetic demo dataset',retrievedAt:null,confidenceMeaning:'Heuristic UI indicator only; not statistical confidence.'},scoreExplanation:{highestFactor:Object.entries({demand,competition,affordability,accessibility,growth}).sort((a,b)=>b[1]*normalized[b[0]]-a[1]*normalized[a[0]])[0]?.[0]||'demand',weights:normalized},components:{demand:Math.round(demand),competition:Math.round(competition),affordability,accessibility,growth},nearbyBusinessCount:localAll,nearbyCategoryCount:localCat,nearestCompetitorKm:catBiz.length?Number(Math.min(...catBiz.map(b=>haversineKm(area,{lat:b.lat,lng:b.lng}))).toFixed(2)):null,estimatedMonthlyRent:area.monthlyRent,averageSpend:area.avgSpend,methodology:'Weighted prototype score using illustrative area indicators and the included demo business dataset.'};
 }).sort((a,b)=>b.score-a.score);
 return {category,results,weights:normalized,meta:{version:'2.1.1',businessCount:businesses.length,categoryBusinessCount:catBiz.length,areaCount:areas.length,dataMode:'DEMO DATA',dataStatus:'illustrative_demo',source:'Bundled synthetic demonstration dataset',lastUpdated:null,notice:'All businesses and area indicators in this starter project are illustrative demo data. Scores are exploratory, not verified market research.'}};
}
const allowedOrigins=(process.env.CORS_ORIGIN||'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173').split(',').map(value=>value.trim()).filter(Boolean);
app.use(cors({origin(origin,callback){if(!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error('Origin not allowed by CORS'));}}));
app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'LMOA API',version:'2.1.1',dataMode:'DEMO DATA'}));
app.get('/api/businesses',(_req,res)=>res.json({items:businesses.map(b=>({...b,color:categoryColors[b.category],dataStatus:'illustrative_demo',sourceLabel:'Synthetic demo record',verified:false,observedAt:null})),meta:{count:businesses.length,dataMode:'DEMO DATA',source:'Bundled synthetic dataset',notice:'These are not verified real-world business listings.'}}));
app.get('/api/areas',(_req,res)=>res.json({items:areas.map(a=>({...a,sourceType:'illustrative demo indicator',dataStatus:'illustrative_demo',verified:false,observedAt:null})),meta:{dataMode:'DEMO DATA',source:'Bundled synthetic area indicators'}}));
app.get('/api/analysis', (req,res)=>{const category=String(req.query.category||'Cafe');const allowed=Object.keys(categoryDemand);if(!allowed.includes(category))return res.status(400).json({error:'Unsupported category',allowed});res.json(buildAnalysis(category));});
app.post('/api/analysis', (req,res)=>{const category=String(req.body?.category||'Cafe');const allowed=Object.keys(categoryDemand);if(!allowed.includes(category))return res.status(400).json({error:'Unsupported category',allowed});const input=req.body?.weights||{};const keys=['demand','competition','affordability','accessibility','growth'];const weights={};for(const k of keys){const v=Number(input[k]??({demand:.35,competition:.25,affordability:.2,accessibility:.12,growth:.08}[k]));if(!Number.isFinite(v)||v<0||v>1)return res.status(400).json({error:`Weight ${k} must be between 0 and 1`});weights[k]=v;}res.json(buildAnalysis(category,weights));});
function calculateFeasibility(body={}){
 const investment=Number(body.investment??0),rent=Number(body.rent??0),staff=Number(body.staff??0),other=Number(body.other??0),customers=Number(body.customers??0),spend=Number(body.spend??0),margin=Number(body.margin??60);
 const values={investment,rent,staff,other,customers,spend,margin};
 for(const [key,value] of Object.entries(values)) if(!Number.isFinite(value)||value<0) throw new Error(`${key} must be a finite non-negative number`);
 if(margin>100) throw new Error('margin must be between 0 and 100');
 if(customers>100000||spend>10000000||investment>1e12||rent>1e10||staff>1e10||other>1e10) throw new Error('One or more values exceed supported limits');
 const run=(customerFactor,marginDelta)=>{
  const scenarioCustomers=customers*customerFactor, scenarioMargin=clamp(margin+marginDelta,0,100)/100;
  const monthlyRevenue=scenarioCustomers*spend*30, monthlyCosts=rent+staff+other, monthlyGrossProfit=monthlyRevenue*scenarioMargin, monthlyOperatingProfit=monthlyGrossProfit-monthlyCosts;
  const breakEvenCustomers=spend*scenarioMargin>0?Math.ceil(monthlyCosts/(spend*scenarioMargin*30)):null;
  return {monthlyRevenue,monthlyCosts,monthlyGrossProfit,monthlyOperatingProfit,breakEvenCustomers,paybackMonths:monthlyOperatingProfit>0?Number((investment/monthlyOperatingProfit).toFixed(1)):null,customersPerDay:scenarioCustomers,marginPercent:scenarioMargin*100};
 };
 return {...run(1,0),scenarios:{conservative:run(.8,-5),expected:run(1,0),optimistic:run(1.2,5)},assumptions:'Scenario outputs use only user-entered assumptions. Conservative and optimistic cases adjust customers/day by -20%/+20% and gross margin by -5/+5 percentage points. Simplified planning estimates, not financial advice.'};
}
app.post('/api/feasibility',(req,res)=>{try{res.json(calculateFeasibility(req.body||{}));}catch(error){res.status(400).json({error:error.message});}});
app.use((err,_req,res,_next)=>{if(err instanceof SyntaxError && 'body' in err)return res.status(400).json({error:'Invalid JSON request body'});if(err?.message==='Origin not allowed by CORS')return res.status(403).json({error:'Origin not allowed'});res.status(500).json({error:'Internal server error'});});
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  app.listen(PORT,()=>console.log(`LMOA API running at http://localhost:${PORT}`));
}
export {buildAnalysis,haversineKm,calculateFeasibility};
