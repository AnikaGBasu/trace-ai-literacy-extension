"""Recompute task statistics and format the manuscript survey summaries.

Run from any working directory: python analysis/reproduce.py
No model calls, network access, or identifiable response text are required.
"""
from pathlib import Path
from itertools import combinations
import hashlib
import json
import platform
import warnings
import numpy as np
import pandas as pd
import scipy
from scipy import stats
import statsmodels
import statsmodels.formula.api as smf
from statsmodels.stats.contingency_tables import cochrans_q, mcnemar
from statsmodels.stats.multitest import multipletests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'results'
OUT.mkdir(exist_ok=True)
CONDITIONS = ['normal_chatgpt', 'generic_extension', 'personalized_extension']
LABELS = dict(zip(CONDITIONS, ['Normal', 'Generic', 'Personalized']))
OUTCOMES = {
    'memory_explanation_score': ('Memory', 0, 4),
    'own_words_score': ('Own-words processing', 0, 3),
    'transfer_score': ('Transfer', 0, 4),
    'verification_needed_identified': ('Identifies need to verify', 0, 1),
    'verification_quality_score': ('Verification quality', 0, 2),
    'incorrect_claim_detected': ('Detects incorrect claim', 0, 1),
    'confidence_calibration_error': ('Calibration error', 0, None),
    'confidence_rating': ('Confidence', 1, 5),
    'task_annoyance_rating': ('Task annoyance', 1, 5),
}
BINARY = {'verification_needed_identified', 'incorrect_claim_detected'}
SURVEY = ['understanding_help_rating', 'verification_help_rating', 'annoyance_rating',
          'effort_reasonable_rating', 'agency_rating', 'would_use_again']
SURVEY_LABELS = ['Helps understanding', 'Helps verification', 'Annoyance',
                 'Effort is reasonable', 'Agency', 'Would use again']
SEED = 20260907
N_BOOT = 20000


def save(df, name):
    df.to_csv(OUT / name, index=False, float_format='%.12g')


def markdown(df):
    def fmt(x):
        if isinstance(x, (float, np.floating)):
            return f'{x:.6g}' if np.isfinite(x) else 'NA'
        return str(x).replace('|', '/')
    rows = ['| ' + ' | '.join(map(str, df.columns)) + ' |',
            '| ' + ' | '.join(['---'] * len(df.columns)) + ' |']
    rows += ['| ' + ' | '.join(fmt(x) for x in row) + ' |' for row in df.itertuples(index=False, name=None)]
    return '\n'.join(rows)


def ci(values):
    return np.quantile(values, [0.025, 0.975], method='linear')


def describe(x, boot_indices):
    x = np.asarray(x, dtype=float)
    low, high = ci(x[boot_indices].mean(axis=1))
    return dict(n=len(x), missing=int(np.isnan(x).sum()), mean=x.mean(), sd=x.std(ddof=1),
                median=np.median(x), q1=np.quantile(x, .25), q3=np.quantile(x, .75),
                minimum=x.min(), maximum=x.max(), mean_ci_low=low, mean_ci_high=high)


def paired(a, b, boot_indices, binary=False):
    """Positive differences and effects mean condition B has larger values."""
    d = np.round(np.asarray(b, float) - np.asarray(a, float), 10)
    low, high = ci(d[boot_indices].mean(axis=1))
    row = dict(n_pairs=len(d), n_zero=int((d == 0).sum()), n_positive=int((d > 0).sum()),
               n_negative=int((d < 0).sum()), mean_difference=d.mean(),
               difference_ci_low=low, difference_ci_high=high, median_difference=np.median(d))
    if binary:
        tab = np.array([[sum((a == 0) & (b == 0)), sum((a == 0) & (b == 1))],
                        [sum((a == 1) & (b == 0)), sum((a == 1) & (b == 1))]])
        res = mcnemar(tab, exact=True, correction=False)
        row.update(test='McNemar exact', statistic=res.statistic, p_raw=res.pvalue,
                   n00=tab[0, 0], n01=tab[0, 1], n10=tab[1, 0], n11=tab[1, 1],
                   effect_type='paired risk difference', effect=d.mean(),
                   effect_ci_low=low, effect_ci_high=high)
    else:
        nz = d[d != 0]
        if len(nz):
            res = stats.wilcoxon(d, zero_method='wilcox', correction=False,
                                 alternative='two-sided', method='approx')
            ranks = stats.rankdata(abs(nz), method='average')
            plus, minus = ranks[nz > 0].sum(), ranks[nz < 0].sum()
            effect = (plus - minus) / (plus + minus)
            # Vectorized bootstrap ranks; zeros excluded within each resample.
            samples = d[boot_indices]
            abs_samples = np.where(samples == 0, np.nan, abs(samples))
            br = stats.rankdata(abs_samples, axis=1, nan_policy='omit')
            bp = np.nansum(np.where(samples > 0, br, 0), axis=1)
            bm = np.nansum(np.where(samples < 0, br, 0), axis=1)
            valid = (bp + bm) > 0
            elow, ehigh = ci((bp[valid] - bm[valid]) / (bp[valid] + bm[valid]))
            row.update(statistic=res.statistic, p_raw=res.pvalue, W_plus=plus, W_minus=minus,
                       z=res.zstatistic, effect=effect, effect_ci_low=elow, effect_ci_high=ehigh,
                       effect_bootstrap_valid=int(valid.sum()))
        else:
            row.update(statistic=0, p_raw=1, W_plus=0, W_minus=0, z=0, effect=0,
                       effect_ci_low=np.nan, effect_ci_high=np.nan, effect_bootstrap_valid=0)
        row.update(test='Wilcoxon normal approximation', effect_type='matched rank-biserial')
    return row


def main():
    data = pd.read_csv(ROOT / 'data/task_outcomes.csv')
    assert data.shape == (105, 15)
    assert not data.isna().any().any()
    assert data.participant_id.nunique() == 35 and data.task_id.nunique() == 105
    assert not data.duplicated(['participant_id', 'condition']).any()
    assert set(data.condition) == set(CONDITIONS)
    ids = sorted(data.participant_id.unique())
    for _, rows in data.groupby('participant_id'):
        assert set(rows.task_order) == {1, 2, 3} and set(rows.task_set) == {'A', 'B', 'C'}
    for name, (_, lower, upper) in OUTCOMES.items():
        assert data[name].ge(lower).all()
        if upper is not None:
            assert data[name].le(upper).all() and (data[name] % 1 == 0).all()
    rng = np.random.default_rng(SEED)
    boot = rng.integers(0, len(ids), size=(N_BOOT, len(ids)))
    desc, omni, pairs, table2, frequencies = [], [], [], [], []
    for outcome, (label, _, _) in OUTCOMES.items():
        wide = data.pivot(index='participant_id', columns='condition', values=outcome).loc[ids, CONDITIONS]
        x = wide.to_numpy(float)
        tr = {'Measure': label}
        for k, condition in enumerate(CONDITIONS):
            ds = describe(x[:, k], boot)
            desc.append(dict(outcome=outcome, condition=condition, **ds))
            if outcome in BINARY:
                tr[LABELS[condition]] = f'{int(x[:, k].sum())}/35 ({100*x[:, k].mean():.2f}%)'
            else:
                tr[LABELS[condition]] = f'{ds["mean"]:.2f} ({ds["sd"]:.2f})'
            for score, n in pd.Series(x[:, k]).value_counts().sort_index().items():
                frequencies.append(dict(outcome=outcome, condition=condition, value=score, n=n, percent=n/35*100))
        table2.append(tr)
        if outcome in BINARY:
            result = cochrans_q(x)
            omni.append(dict(outcome=outcome, test='Cochran Q', n=35, df=2,
                             statistic=result.statistic, p_raw=result.pvalue, kendall_W=np.nan))
        else:
            result = stats.friedmanchisquare(*x.T)
            omni.append(dict(outcome=outcome, test='Friedman', n=35, df=2,
                             statistic=result.statistic, p_raw=result.pvalue,
                             kendall_W=result.statistic/(35*2)))
        for i, j in combinations(range(3), 2):
            pairs.append(dict(outcome=outcome, condition_A=CONDITIONS[i], condition_B=CONDITIONS[j],
                              family='task_self_report_6' if outcome in ['confidence_rating', 'task_annoyance_rating'] else 'objective_21',
                              **paired(x[:, i], x[:, j], boot, outcome in BINARY)))
    pairdf = pd.DataFrame(pairs)
    for family, rows in pairdf.groupby('family'):
        assert len(rows) == (21 if family == 'objective_21' else 6)
        pairdf.loc[rows.index, 'p_holm'] = multipletests(rows.p_raw, method='holm')[1]
    omnidf = pd.DataFrame(omni)
    # Supplement-only sensitivity family; main paper reports omnibus tests unadjusted.
    omnidf['p_holm_exploratory_9'] = multipletests(omnidf.p_raw, method='holm')[1]
    save(pd.DataFrame(desc), 'task_descriptives.csv')
    save(pd.DataFrame(frequencies), 'task_score_frequencies.csv')
    save(omnidf, 'omnibus_tests.csv')
    save(pairdf, 'task_pairwise_tests.csv')
    save(pd.DataFrame(table2), 'table_2.csv')
    t3 = pd.read_csv(ROOT / 'data/manuscript_survey_summary.csv', dtype={'p_holm_reported':str})
    assert t3.shape == (6, 4)
    save(t3, 'table_3.csv')
    pref = pd.read_csv(ROOT / 'data/manuscript_preference_summary.csv')
    assert pref.n.sum() == 35
    save(pref, 'preference_reported.csv')
    for name in ['condition_order', 'task_order', 'task_set']:
        save(pd.crosstab(data[name], data.condition).reset_index(), f'balance_{name}.csv')
    save(data[['participant_id','task_id','condition','condition_order','task_order','task_set']], 'assignment_schedule.csv')
    checks = []
    data = data.sort_values(['participant_id', 'task_order']).copy()
    previous = data.groupby('participant_id').condition.shift(1)
    data['previous_generic'] = (previous == 'generic_extension').astype(int)
    data['previous_personalized'] = (previous == 'personalized_extension').astype(int)
    for outcome in OUTCOMES:
        formula = f'{outcome} ~ C(participant_id) + C(condition) + C(task_order) + C(task_set)'
        for carry in [False, True]:
            form = formula + (' + previous_generic + previous_personalized' if carry else '')
            model = smf.ols(form, data=data).fit(cov_type='cluster', cov_kwds={'groups': data.participant_id, 'use_correction': True})
            assert np.linalg.matrix_rank(model.model.exog) == model.model.exog.shape[1]
            if carry:
                terms = {'previous_condition': ['previous_generic', 'previous_personalized']}
            else:
                terms = {term: [n for n in model.params.index if n.startswith(f'C({term})[')] for term in ['task_order','task_set']}
            for term, names in terms.items():
                restriction = np.zeros((len(names), len(model.params)))
                for j, name in enumerate(names):
                    restriction[j, model.params.index.get_loc(name)] = 1
                result = model.wald_test(restriction, use_f=True, scalar=True)
                checks.append(dict(outcome=outcome, check=term, test='cluster-robust Wald F',
                                   statistic=float(result.statistic), df_num=float(result.df_num),
                                   df_den=float(result.df_denom), p_raw=float(result.pvalue),
                                   formula=form, analysis_type='exploratory'))
        wide = data.pivot(index='participant_id', columns='condition', values=outcome)
        d = wide.personalized_extension - wide.normal_chatgpt
        seq = data.drop_duplicates('participant_id').set_index('participant_id').condition_order
        groups = [d.loc[seq[seq == order].index] for order in sorted(seq.unique())]
        values = np.concatenate(groups)
        res = stats.kruskal(*groups) if np.ptp(values) else None
        checks.append(dict(outcome=outcome, check='sequence_heterogeneity_of_P_minus_N',
                           test='Kruskal-Wallis', statistic=res.statistic if res else 0,
                           df_num=5, df_den=np.nan, p_raw=res.pvalue if res else 1,
                           formula='Personalized - Normal outcome by six condition sequences',
                           analysis_type='exploratory'))
    checkdf = pd.DataFrame(checks)
    checkdf['p_holm_exploratory_36'] = multipletests(checkdf.p_raw, method='holm')[1]
    save(checkdf, 'order_set_carryover_checks.csv')
    report = '# Full numerical results\n\n'
    report += 'Table 2 gives task means (sample SD) or counts/35 (%). Table 3 reproduces the mean ratings and Holm-adjusted p-values printed in manuscript Figure 3. Machine-readable task results retain full numerical precision.\n\n'
    report += '## Table 2 — task outcomes\n\n' + markdown(pd.DataFrame(table2))
    report += '\n\n## Table 3 — post-trial ratings\n\n' + markdown(t3.assign(Generic=t3.Generic.map(lambda x:f'{x:.2f}'), Personalized=t3.Personalized.map(lambda x:f'{x:.2f}')).rename(columns={'item':'Measure','p_holm_reported':'p_H'}))
    report += '\n\n## Omnibus tests\n\n' + markdown(omnidf)
    report += '\n\n## Paired task tests\n\n' + markdown(pairdf[['outcome','condition_A','condition_B','statistic','p_raw','p_holm','effect']])
    report += '\n\nTable 3 values are reported at manuscript precision; p_H denotes the Holm-adjusted paired Wilcoxon comparison.\n'
    report += '\n\n## Preference\n\n' + markdown(pref)
    report += '\n\n## Exploratory order, task-set and carryover checks\n\n' + markdown(checkdf[['outcome','check','statistic','df_num','df_den','p_raw','p_holm_exploratory_36']])
    report += '\n\nTask-set checks compare sets A, B, and C while controlling for condition and task position. Preference percentages retain the manuscript display precision.\n'
    (OUT/'numerical_tables.md').write_text(report)
    meta = dict(seed=SEED, bootstrap_replicates=N_BOOT, numpy=np.__version__, pandas=pd.__version__,
                scipy=scipy.__version__, statsmodels=statsmodels.__version__, python=platform.python_version(),
                input_sha256={name:hashlib.sha256((ROOT/'data'/name).read_bytes()).hexdigest()
                              for name in ['task_outcomes.csv','manuscript_survey_summary.csv','manuscript_preference_summary.csv']})
    (OUT/'analysis_run.json').write_text(json.dumps(meta, indent=2)+'\n')
    print(f'Validated 35 participants / 105 tasks; wrote {len(list(OUT.iterdir()))} result files.')
    print('Survey and preference tables use manuscript-reported aggregates.')


if __name__ == '__main__':
    main()
