"""Calculate validation tables only from complete, real human/model labels."""
from pathlib import Path
import argparse
import numpy as np
import pandas as pd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--kind',choices=['risk','evaluator'],required=True)
    parser.add_argument('--input',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    data = pd.read_csv(args.input, dtype=str)
    required = ['example_id','human_label','system_label']
    if not set(required) <= set(data):
        parser.error('Input requires example_id, human_label, system_label')
    if len(data) != 100 or data.example_id.nunique() != 100:
        parser.error('Exactly 100 unique cases are required; no duplicates or replacements')
    if data[required].isna().any().any():
        parser.error('Labels are missing. Blank annotation forms cannot reproduce agreement.')
    labels = ['low','medium','high'] if args.kind == 'risk' else ['0','1','2']
    if not set(data.human_label) <= set(labels) or not set(data.system_label) <= set(labels):
        parser.error('Label outside the required categories')
    matrix = pd.crosstab(data.human_label,data.system_label).reindex(index=labels,columns=labels,fill_value=0)
    arr = matrix.to_numpy()
    rows=[]
    for j,label in enumerate(labels):
        support, predicted = arr[j,:].sum(),arr[:,j].sum()
        rows.append(dict(category=label,human_support=support,system_support=predicted,matches=arr[j,j],
                         per_category_agreement=arr[j,j]/support if support else np.nan,
                         model_label_precision=arr[j,j]/predicted if predicted else np.nan))
    args.output.mkdir(parents=True,exist_ok=True)
    matrix.rename_axis('human_label').to_csv(args.output/'confusion_matrix.csv')
    pd.DataFrame(rows).to_csv(args.output/'per_category_agreement.csv',index=False)
    matched=int(np.trace(arr)); expected=86 if args.kind=='risk' else 92
    pd.DataFrame([dict(n=100,matches=matched,disagreements=100-matched,agreement=matched/100,
                       paper_matches=expected,matches_reported_total=matched==expected)]).to_csv(args.output/'agreement_summary.csv',index=False)
    print(f'{args.kind}: {matched}/100 exact agreements. Matches reported total: {matched==expected}')


if __name__=='__main__':
    main()
