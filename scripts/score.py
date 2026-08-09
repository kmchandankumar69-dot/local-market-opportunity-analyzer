#!/usr/bin/env python3
import csv
import json
import sys
from collections import defaultdict

BUSINESS_THRESHOLD = 6  # for competition normalization
WEIGHTS = { 'demand':0.35, 'competition':0.25, 'accessibility':0.15, 'affordability':0.15, 'growth':0.10 }

def read_businesses(path):
    rows = []
    with open(path) as f:
        reader = csv.DictReader(f)
        for r in reader:
            r['lat'] = float(r.get('lat') or 0)
            r['lng'] = float(r.get('lng') or 0)
            rows.append(r)
    return rows

def read_survey(path):
    with open(path) as f:
        return json.load(f)

def compute_scores(businesses, survey):
    total = survey.get('total_responses') or len(survey.get('responses',[]))
    demand_count = defaultdict(int)
    for r in survey.get('responses',[]):
        for c in r.get('interests',[]):
            demand_count[c]+=1
    categories = set([b['category'] for b in businesses] + list(demand_count.keys()))
    results = []
    for cat in categories:
        demand = (demand_count.get(cat,0)/total) if total>0 else 0
        business_count = sum(1 for b in businesses if b['category']==cat)
        competition_ratio = min(1, business_count / BUSINESS_THRESHOLD)
        accessibility = 0.7
        affordability = 0.6
        growth = 0.3
        score = WEIGHTS['demand']*demand + WEIGHTS['competition']*(1-competition_ratio) + WEIGHTS['accessibility']*accessibility + WEIGHTS['affordability']*affordability + WEIGHTS['growth']*growth
        results.append({'category':cat, 'score':round(score,3), 'components':{'demand':demand,'competition_ratio':competition_ratio,'accessibility':accessibility,'affordability':affordability,'growth':growth}})
    results.sort(key=lambda x: x['score'], reverse=True)
    return results

if __name__=='__main__':
    if len(sys.argv)<3:
        print('Usage: score.py businesses.csv survey.json')
        sys.exit(1)
    businesses = read_businesses(sys.argv[1])
    survey = read_survey(sys.argv[2])
    res = compute_scores(businesses, survey)
    print('Opportunity scores:')
    for r in res:
        print(f" - {r['category']}: {r['score']} (demand={r['components']['demand']}, competition={r['components']['competition_ratio']})")
    with open('opportunities.json','w') as f:
        json.dump(res, f, indent=2)
    print('\nSaved opportunities.json')
