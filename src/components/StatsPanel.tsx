'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './animal-ui';
import * as XLSX from 'xlsx';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('/api/stats')
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(result => {
        console.log('Stats API response:', result);
        const data = Array.isArray(result) ? result : (result?.results || result?.data);
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          setError('返回数据格式异常: ' + JSON.stringify(result).slice(0, 200));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setError('获取数据失败: ' + err.message);
        setLoading(false);
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

    // Initialize with all known categories from prizeData
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
      if (!catValue) return;
      
      // If category doesn't exist in prizeData, create it dynamically
      if (!stats[catValue]) {
        stats[catValue] = {
          label: catValue,
          count: 0,
          subs: {},
        };
      }
      
      stats[catValue].count++;
      totalVotes++;
      
      if (subValue) {
        if (!stats[catValue].subs[subValue]) {
          stats[catValue].subs[subValue] = { label: subValue, count: 0 };
        }
        stats[catValue].subs[subValue].count++;
      }
    });

    return { stats, totalVotes };
  };

  const firstPrize = useMemo(() => calculateStats('firstCat', 'firstSub'), [submissions, prizeData]);
  const secondPrize = useMemo(() => calculateStats('secondCat', 'secondSub'), [submissions, prizeData]);
  const thirdPrize = useMemo(() => calculateStats('thirdCat', 'thirdSub'), [submissions, prizeData]);

  const getPrizeLabel = (catValue: string, subValue: string) => {
    const cat = prizeData[catValue];
    if (!cat) return catValue || '-';
    const sub = cat.subs.find(s => s.value === subValue);
    return `${cat.label}${sub ? ` - ${sub.label}` : ''}`;
  };

  // 导出完整统计 Excel
  const exportExcel = () => {
    if (submissions.length === 0) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: 提交名单
    const records = submissions.map((sub, idx) => ({
      序号: idx + 1,
      姓名: sub.name || '-',
      一等奖: getPrizeLabel(sub.firstCat, sub.firstSub),
      二等奖: getPrizeLabel(sub.secondCat, sub.secondSub),
      三等奖: getPrizeLabel(sub.thirdCat, sub.thirdSub),
      建议: sub.suggestions || '-',
      提交时间: sub.createdAt ? new Date(sub.createdAt).toLocaleString('zh-CN') : '-',
    }));
    const wsRecords = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(wb, wsRecords, '提交名单');

    // Sheet 2: 一等奖统计
    const firstRows: any[] = [];
    Object.entries(firstPrize.stats)
      .filter(([_, cat]) => cat.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([catKey, cat]) => {
        const catPct = firstPrize.totalVotes > 0 ? Math.round((cat.count / firstPrize.totalVotes) * 100) : 0;
        firstRows.push({
          奖项: '一等奖',
          大类: cat.label,
          大类票数: cat.count,
          大类占比: catPct + '%',
          子类: '(大类汇总)',
          子类票数: '',
          子类占比: '',
        });
        Object.entries(cat.subs)
          .filter(([_, sub]) => sub.count > 0)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([subKey, sub]) => {
            const subPct = cat.count > 0 ? Math.round((sub.count / cat.count) * 100) : 0;
            firstRows.push({
              奖项: '一等奖',
              大类: '',
              大类票数: '',
              大类占比: '',
              子类: sub.label,
              子类票数: sub.count,
              子类占比: subPct + '%',
            });
          });
      });
    const wsFirst = XLSX.utils.json_to_sheet(firstRows);
    XLSX.utils.book_append_sheet(wb, wsFirst, '一等奖统计');

    // Sheet 3: 二等奖统计
    const secondRows: any[] = [];
    Object.entries(secondPrize.stats)
      .filter(([_, cat]) => cat.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([catKey, cat]) => {
        const catPct = secondPrize.totalVotes > 0 ? Math.round((cat.count / secondPrize.totalVotes) * 100) : 0;
        secondRows.push({
          奖项: '二等奖',
          大类: cat.label,
          大类票数: cat.count,
          大类占比: catPct + '%',
          子类: '(大类汇总)',
          子类票数: '',
          子类占比: '',
        });
        Object.entries(cat.subs)
          .filter(([_, sub]) => sub.count > 0)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([subKey, sub]) => {
            const subPct = cat.count > 0 ? Math.round((sub.count / cat.count) * 100) : 0;
            secondRows.push({
              奖项: '二等奖',
              大类: '',
              大类票数: '',
              大类占比: '',
              子类: sub.label,
              子类票数: sub.count,
              子类占比: subPct + '%',
            });
          });
      });
    const wsSecond = XLSX.utils.json_to_sheet(secondRows);
    XLSX.utils.book_append_sheet(wb, wsSecond, '二等奖统计');

    // Sheet 4: 三等奖统计
    const thirdRows: any[] = [];
    Object.entries(thirdPrize.stats)
      .filter(([_, cat]) => cat.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([catKey, cat]) => {
        const catPct = thirdPrize.totalVotes > 0 ? Math.round((cat.count / thirdPrize.totalVotes) * 100) : 0;
        thirdRows.push({
          奖项: '三等奖',
          大类: cat.label,
          大类票数: cat.count,
          大类占比: catPct + '%',
          子类: '(大类汇总)',
          子类票数: '',
          子类占比: '',
        });
        Object.entries(cat.subs)
          .filter(([_, sub]) => sub.count > 0)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([subKey, sub]) => {
            const subPct = cat.count > 0 ? Math.round((sub.count / cat.count) * 100) : 0;
            thirdRows.push({
              奖项: '三等奖',
              大类: '',
              大类票数: '',
              大类占比: '',
              子类: sub.label,
              子类票数: sub.count,
              子类占比: subPct + '%',
            });
          });
      });
    const wsThird = XLSX.utils.json_to_sheet(thirdRows);
    XLSX.utils.book_append_sheet(wb, wsThird, '三等奖统计');

    XLSX.writeFile(wb, `年会奖品许愿统计_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const renderPrizeCard = (title: string, color: string, prizeStats: PrizeStats) => {
    const { stats, totalVotes } = prizeStats;
    const sortedCats = Object.entries(stats)
      .filter(([_, cat]) => cat.count > 0)
      .sort((a, b) => b[1].count - a[1].count);
    
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: color }}>{title}</h3>
          <span style={{ fontSize: '14px', color: 'var(--animal-text-muted)' }}>共 {totalVotes} 票</span>
        </div>
        {totalVotes === 0 ? (
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>暂无投票数据</p>
        ) : (
          <div>
            {sortedCats.map(([catKey, cat]) => {
              const percentage = totalVotes > 0 ? Math.floor((cat.count / totalVotes) * 100) : 0;
              const isExpanded = expanded.includes(`${title}-${catKey}`);
              const sortedSubs = Object.entries(cat.subs)
                .filter(([_, sub]) => sub.count > 0)
                .sort((a, b) => b[1].count - a[1].count);
              
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

                  {isExpanded && sortedSubs.length > 0 && (
                    <div style={{ paddingLeft: '16px' }}>
                      {sortedSubs.map(([subKey, sub]) => {
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--animal-text-muted)' }}>
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#d4602f', marginBottom: '16px' }}>{error}</p>
        <p style={{ fontSize: '14px', color: 'var(--animal-text-muted)' }}>
          提交总数: {submissions.length}
        </p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
          若问题持续，请打开浏览器开发者工具查看网络请求详情
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 导出按钮 */}
      <div style={{ textAlign: 'right', marginBottom: '12px' }}>
        <Button size="small" onClick={exportExcel} disabled={submissions.length === 0}>
          导出完整统计
        </Button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--animal-primary-active)' }}>
          {submissions.length}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--animal-text-muted)', marginLeft: '6px' }}>份问卷</span>
      </div>

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
