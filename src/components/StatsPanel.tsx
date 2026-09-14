'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface PrizeData {
  label: string;
  icon: string;
  subs: { value: string; label: string }[];
}

interface StatsPanelProps {
  prizeData: Record<string, PrizeData>;
}

interface SubStat {
  label: string;
  count: number;
}

interface CategoryStat {
  label: string;
  count: number;
  subs: Record<string, SubStat>;
}

interface PrizeStats {
  stats: Record<string, CategoryStat>;
  totalVotes: number;
}

export default function StatsPanel({ prizeData }: StatsPanelProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(result => {
        const data = Array.isArray(result) ? result : (result?.results || result?.data);
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
      });
  }, []);

  const toggleExpand = (key: string) => {
    setExpanded(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const calculateStats = (catKey: string, subKey: string): PrizeStats => {
    const stats: Record<string, CategoryStat> = {};
    let totalVotes = 0;

    Object.keys(prizeData).forEach(key => {
      stats[key] = {
        label: prizeData[key].label,
        count: 0,
        subs: prizeData[key].subs.reduce((acc, sub) => {
          acc[sub.value] = { label: sub.label, count: 0 };
          return acc;
        }, {} as Record<string, SubStat>),
      };
    });

    submissions.forEach((sub: any) => {
      const catValue = sub[catKey] as string;
      const subValue = sub[subKey] as string;
      if (stats[catValue]) {
        stats[catValue].count++;
        totalVotes++;
        if (stats[catValue].subs[subValue]) {
          stats[catValue].subs[subValue].count++;
        }
      }
    });

    return { stats, totalVotes };
  };

  const firstPrize = useMemo(() => calculateStats('firstCat', 'firstSub'), [submissions, prizeData]);
  const secondPrize = useMemo(() => calculateStats('secondCat', 'secondSub'), [submissions, prizeData]);
  const thirdPrize = useMemo(() => calculateStats('thirdCat', 'thirdSub'), [submissions, prizeData]);

  const renderPrizeCard = (title: string, color: string, prizeStats: PrizeStats) => {
    const { stats, totalVotes } = prizeStats;
    return (
      <div
        style={{
          border: '1.5px solid var(--animal-border)',
          borderRadius: 'var(--animal-radius-lg)',
          background: 'var(--animal-bg-input)',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: color }}>
          {title}
        </h3>
        {totalVotes === 0 ? (
          <p style={{ fontSize: '14px', color: '#999' }}>暂无投票数据</p>
        ) : (
          <div>
            {Object.keys(stats).map(catKey => {
              const cat = stats[catKey];
              const percentage = totalVotes > 0 ? Math.floor((cat.count / totalVotes) * 100) : 0;
              const isExpanded = expanded.includes(`${title}-${catKey}`);
              return (
                <div key={catKey} style={{ marginBottom: '12px' }}>
                  <div
                    onClick={() => toggleExpand(`${title}-${catKey}`)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '16px',
                          marginRight: '8px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat.label}
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          color: '#666',
                          marginRight: '8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat.count}票
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          color: '#999',
                          minWidth: '40px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: '12px',
                        height: '8px',
                        background: 'var(--animal-bg-disabled)',
                        borderRadius: 'var(--animal-radius-pill)',
                        overflow: 'hidden',
                        minWidth: '60px',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: color,
                          borderRadius: 'var(--animal-radius-pill)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#666',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ paddingLeft: '16px' }}>
                      {Object.keys(cat.subs).map(subKey => {
                        const sub = cat.subs[subKey];
                        const subPercentage = cat.count > 0 ? Math.floor((sub.count / cat.count) * 100) : 0;
                        return (
                          <div
                            key={subKey}
                            style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}
                          >
                            <span
                              style={{
                                fontSize: '14px',
                                marginRight: '8px',
                                minWidth: '80px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {sub.label}
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#666',
                                marginRight: '8px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {sub.count}票
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#999',
                                minWidth: '40px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {subPercentage}%
                            </span>
                            <div
                              style={{
                                flex: 1,
                                marginLeft: '8px',
                                height: '6px',
                                background: 'var(--animal-bg-disabled)',
                                borderRadius: 'var(--animal-radius-pill)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${subPercentage}%`,
                                  height: '100%',
                                  background: color,
                                  opacity: 0.6,
                                  borderRadius: 'var(--animal-radius-pill)',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getPrizeLabel = (catValue: string, subValue: string) => {
    const cat = prizeData[catValue];
    if (!cat) return catValue || '-';
    const sub = cat.subs.find(s => s.value === subValue);
    return `${cat.label}${sub ? ` - ${sub.label}` : ''}`;
  };

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      {renderPrizeCard('一等奖投票分布', '#c49a2e', firstPrize)}
      {renderPrizeCard('二等奖投票分布', '#5a9e8a', secondPrize)}
      {renderPrizeCard('三等奖投票分布', '#8f6a4e', thirdPrize)}

      <div
        style={{
          border: '1.5px solid var(--animal-border)',
          borderRadius: 'var(--animal-radius-lg)',
          background: 'var(--animal-bg-input)',
          padding: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
          提交名单 ({submissions.length})
        </h3>
        {submissions.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#999' }}>暂无提交数据</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--animal-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px' }}>姓名</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px' }}>一等奖</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px' }}>二等奖</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px' }}>三等奖</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{sub.name || '-'}</td>
                    <td style={{ padding: '8px' }}>{getPrizeLabel(sub.firstCat, sub.firstSub)}</td>
                    <td style={{ padding: '8px' }}>{getPrizeLabel(sub.secondCat, sub.secondSub)}</td>
                    <td style={{ padding: '8px' }}>{getPrizeLabel(sub.thirdCat, sub.thirdSub)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
