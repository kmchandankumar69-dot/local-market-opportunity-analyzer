import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalysis, haversineKm, calculateFeasibility } from './index.js';

test('analysis returns sorted bounded scores and explicit demo provenance',()=>{
 const a=buildAnalysis('Cafe');
 assert.equal(a.results.length,7);
 assert.ok(a.results.every(x=>x.score>=0&&x.score<=100));
 assert.ok(a.results.every((x,i)=>i===0||a.results[i-1].score>=x.score));
 assert.equal(a.meta.dataMode,'DEMO DATA');
 assert.equal(a.meta.dataStatus,'illustrative_demo');
 assert.ok(a.results.every(x=>x.dataQuality.status==='illustrative_demo'));
});
test('haversine distance is zero for same point',()=>assert.equal(haversineKm({lat:12,lng:77},{lat:12,lng:77}),0));
test('weights are normalized and zero weights do not crash scoring',()=>{
 const a=buildAnalysis('Cafe',{demand:0,competition:0,affordability:1,accessibility:0,growth:0});
 assert.equal(a.weights.affordability,1);
 assert.ok(a.results.every(x=>x.score===Math.round(x.components.demand*a.weights.demand+x.components.competition*a.weights.competition+x.components.affordability*a.weights.affordability+x.components.accessibility*a.weights.accessibility+x.components.growth*a.weights.growth)));
});
test('financial scenarios are ordered and include break-even details',()=>{
 const a=calculateFeasibility({investment:100000,rent:10000,staff:10000,other:5000,customers:50,spend:200,margin:60});
 assert.ok(a.scenarios.conservative.monthlyRevenue<a.scenarios.expected.monthlyRevenue);
 assert.ok(a.scenarios.optimistic.monthlyRevenue>a.scenarios.expected.monthlyRevenue);
 assert.equal(a.scenarios.expected.monthlyOperatingProfit,a.monthlyOperatingProfit);
 assert.ok(a.breakEvenCustomers>0);
});
test('financial calculation rejects invalid numeric input',()=>assert.throws(()=>calculateFeasibility({customers:-1}),/non-negative/));
test('financial calculation rejects margin above 100',()=>assert.throws(()=>calculateFeasibility({margin:101}),/between 0 and 100/));
