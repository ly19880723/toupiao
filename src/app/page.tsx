'use client';

import React, { useState, useEffect } from 'react';
import {
  NotificationContainer, Notification,
  Button, Input, Select, Modal,
  Progress, Tag, Title, Divider, Footer
} from '@/components/animal-ui';
import { PrizeAdmin } from '@/components/PrizeAdmin';
import StatsPanel from '@/components/StatsPanel';

interface PrizeData {
  label: string;
  icon: string;
  subs: { value: string; label: string }[];
}

interface GroupedPrizeData {
  first: Record<string, PrizeData>;
  second: Record<string, PrizeData>;
  third: Record<string, PrizeData>;
}

const DEFAULT_PRIZE_DATA: GroupedPrizeData = {
  first: {
    electronics: {
      label: '数码电子',
      icon: 'camera',
      subs: [
        { value: 'iphone', label: 'iPhone' },
        { value: 'ipad', label: 'iPad' },
        { value: 'airpods', label: 'AirPods' },
        { value: 'watch', label: '智能手表' },
        { value: 'projector', label: '投影仪' },
      ]
    },
    home: {
      label: '家居生活',
      icon: 'home',
      subs: [
        { value: 'robot', label: '扫地机器人' },
        { value: 'massage', label: '按摩椅/按摩仪' },
      ]
    },
    travel: {
      label: '旅行基金',
      icon: 'plane',
      subs: [
        { value: 'overseas', label: '出境游基金' },
        { value: 'hotel', label: '星级酒店券' },
      ]
    },
  },
  second: {
    electronics: {
      label: '数码电子',
      icon: 'camera',
      subs: [
        { value: 'switch', label: '任天堂 Switch' },
        { value: 'airpods', label: 'AirPods' },
        { value: 'watch', label: '智能手表' },
      ]
    },
    home: {
      label: '家居生活',
      icon: 'home',
      subs: [
        { value: 'coffee_machine', label: '咖啡机' },
        { value: 'airfryer', label: '空气炸锅' },
        { value: 'blanket', label: '蚕丝被/羽绒被' },
        { value: 'cookware', label: '厨具套装' },
      ]
    },
    food: {
      label: '食品礼盒',
      icon: 'coffee',
      subs: [
        { value: 'snack', label: '零食大礼包' },
        { value: 'tea', label: '茶叶礼盒' },
        { value: 'wine', label: '酒水/红酒' },
        { value: 'seafood', label: '海鲜礼盒' },
      ]
    },
    sport: {
      label: '运动健身',
      icon: 'trophy',
      subs: [
        { value: 'fascia', label: '筋膜枪' },
        { value: 'treadmill', label: '家用跑步机' },
        { value: 'skateboard', label: '滑板/陆冲板' },
      ]
    },
  },
  third: {
    food: {
      label: '食品礼盒',
      icon: 'coffee',
      subs: [
        { value: 'fruit', label: '进口水果礼盒' },
        { value: 'snack', label: '零食大礼包' },
      ]
    },
    sport: {
      label: '运动健身',
      icon: 'trophy',
      subs: [
        { value: 'yoga', label: '瑜伽套装' },
        { value: 'dumbbell', label: '家用哑铃套装' },
        { value: 'fascia', label: '筋膜枪' },
      ]
    },
    travel: {
      label: '旅行基金',
      icon: 'plane',
      subs: [
        { value: 'domestic', label: '国内短途游' },
        { value: 'camping', label: '露营装备套装' },
      ]
    },
    shopping: {
      label: '购物卡券',
      icon: 'cart',
      subs: [
        { value: 'jd', label: '京东卡' },
        { value: 'tmall', label: '天猫超市卡' },
        { value: 'gas', label: '加油卡' },
        { value: 'starbucks', label: '星巴克/咖啡券' },
        { value: 'cinema', label: '电影卡' },
      ]
    },
  },
};

export default function Home() {
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [firstCat, setFirstCat] = useState('');
  const [firstSub, setFirstSub] = useState('');
  const [firstOther, setFirstOther] = useState('');
  const [secondCat, setSecondCat] = useState('');
  const [secondSub, setSecondSub] = useState('');
  const [secondOther, setSecondOther] = useState('');
  const [thirdCat, setThirdCat] = useState('');
  const [thirdSub, setThirdSub] = useState('');
  const [thirdOther, setThirdOther] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [authMode, setAuthMode] = useState<string | null>(null);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [prizeData, setPrizeData] = useState<GroupedPrizeData>(DEFAULT_PRIZE_DATA);
  const [prizeLoaded, setPrizeLoaded] = useState(false);

  // Load prize data from API (cloud first, fallback to default only on error)
  useEffect(() => {
    fetch('/api/prizes')
      .then(res => res.json())
      .then(result => {
        // Use cloud data if available (even if empty), only fall back to default on error
        if (result && typeof result.data === 'object') {
          setPrizeData(result.data);
        }
        setPrizeLoaded(true);
      })
      .catch(() => {
        setPrizeLoaded(true);
      });
  }, []);

  const fields = [name.trim(), firstCat && (firstSub === '__other__' ? firstOther.trim() : firstSub), secondCat && (secondSub === '__other__' ? secondOther.trim() : secondSub), thirdCat && (thirdSub === '__other__' ? thirdOther.trim() : thirdSub)];
  const filled = fields.filter(Boolean).length;
  const progress = Math.round((filled / 4) * 100);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '请填写姓名';
    if (!firstCat || (!firstSub && firstSub !== '__other__') || (firstSub === '__other__' && !firstOther.trim())) errs.first = '请选择或填写一等奖的奖品';
    if (!secondCat || (!secondSub && secondSub !== '__other__') || (secondSub === '__other__' && !secondOther.trim())) errs.second = '请选择或填写二等奖的奖品';
    if (!thirdCat || (!thirdSub && thirdSub !== '__other__') || (thirdSub === '__other__' && !thirdOther.trim())) errs.third = '请选择或填写三等奖的奖品';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      Notification.warning({ message: '许愿未填写完整', description: '请检查标红的必填项' });
      return;
    }
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    const record = {
      name: name.trim(),
      firstCat,
      firstSub: firstSub === '__other__' ? `__OTHER__:${firstOther.trim()}` : firstSub,
      secondCat,
      secondSub: secondSub === '__other__' ? `__OTHER__:${secondOther.trim()}` : secondSub,
      thirdCat,
      thirdSub: thirdSub === '__other__' ? `__OTHER__:${thirdOther.trim()}` : thirdSub,
      suggestions: suggestions.trim(),
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });

      if (!res.ok) throw new Error('提交失败');

      setSubmitting(false);
      setSubmitted(true);
      Notification.success({
        message: '许愿提交成功！',
        description: '你的心愿已送达，祝年会好运！',
        duration: 5,
      });
    } catch (e) {
      setSubmitting(false);
      Notification.error({ message: '提交失败', description: '请稍后重试' });
    }
  };

  const resetForm = () => {
    setName(''); setSuggestions('');
    setFirstCat(''); setFirstSub(''); setFirstOther('');
    setSecondCat(''); setSecondSub(''); setSecondOther('');
    setThirdCat(''); setThirdSub(''); setThirdOther('');
    setErrors({}); setSubmitted(false);
  };

  const getPrizeLabel = (cat: string, sub: string, level: 'first' | 'second' | 'third') => {
    if (!cat || !sub) return '未选';
    const group = prizeData[level];
    const c = group?.[cat];
    if (!c) return `${cat} - ${sub}`;
    // Check if sub is a custom __OTHER__ value
    if (sub.startsWith('__OTHER__:')) {
      const customText = sub.replace('__OTHER__:', '');
      return `${c.label} - ${customText} (自定义)`;
    }
    const s = c.subs?.find(s => s.value === sub);
    return (c.label || cat) + ' - ' + (s?.label || sub);
  };

  const handleAuth = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdInput }),
      });
      const result = await res.json();

      if (result.valid) {
        if (authMode === 'admin') setShowAdmin(true);
        else setShowStats(true);
        setAuthMode(null);
        setPwdInput('');
        setPwdError('');
      } else {
        setPwdError('密码错误，请重试');
      }
    } catch (e) {
      setPwdError('验证失败，请稍后重试');
    }
  };

  const handleSavePrizes = async (newData: GroupedPrizeData) => {
    try {
      const res = await fetch('/api/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });

      if (!res.ok) throw new Error('保存失败');

      setPrizeData(newData);
      setShowAdmin(false);
      Notification.success({ message: '奖品数据已保存' });
    } catch (e) {
      Notification.error({ message: '保存失败', description: '请稍后重试' });
    }
  };

  const renderPrizeSelect = (
    level: 'first' | 'second' | 'third',
    cat: string, setCat: (v: string) => void,
    sub: string, setSub: (v: string) => void,
    other: string, setOther: (v: string) => void,
    errorKey: string,
    label: string
  ) => {
    const group = prizeData[level] || {};
    const catOptions = Object.entries(group).map(([k, p]) => ({ value: k, label: p.label }));
    const currentSubs = cat && group[cat] ? group[cat].subs : [];
    const isOther = sub === '__other__';

    return (
      <div className="form-item" style={{ marginBottom: 0 }}>
        <label className="form-label">{label}<span className="required">*</span></label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <Select
              value={cat}
              onChange={(v: string) => { setCat(v); setSub(''); setOther(''); }}
              options={[{ value: '', label: '选择大类...' }, ...catOptions]} />
          </div>
          {cat && (
            <>
              <div style={{ flex: 1, minWidth: '120px' }}>
                {!isOther ? (
                  <Select
                    value={sub}
                    onChange={(v: string) => { setSub(v); if (v !== '__other__') setOther(''); }}
                    options={[
                      { value: '', label: '选择子类...' },
                      ...currentSubs.map(s => ({ value: s.value, label: s.label })),
                      { value: '__other__', label: '其他...' }
                    ]} />
                ) : (
                  <Input
                    value={other}
                    onChange={(e: any) => setOther(e.target.value)}
                    placeholder="请输入自定义奖品"
                    allowClear />
                )}
              </div>
              {isOther && (
                <div style={{ flex: '0 0 100%', marginTop: '-4px' }}>
                  <Button size="small" onClick={() => { setSub(''); setOther(''); }}>
                    返回选择列表
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        {errors[errorKey] && <div className="form-error-msg">{errors[errorKey]}</div>}
      </div>
    );
  };

  if (submitted) {
    return (
      <>
        <NotificationContainer />
        <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '120px' }}>
          <Title size="large" color="app-yellow">{'许愿成功'}</Title>
          <div className="card" style={{ marginTop: '32px', textAlign: 'left' }}>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>
              你的心愿已收到！以下是许愿摘要：
            </p>
            <div style={{ marginBottom: '10px' }}>
              <Tag color="teal">姓名</Tag>
              <span style={{ marginLeft: '8px' }}>{name}</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Tag color="yellow">一等奖</Tag>
              <span style={{ marginLeft: '8px' }}>{getPrizeLabel(firstCat, firstSub, 'first')}</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Tag color="yellow">二等奖</Tag>
              <span style={{ marginLeft: '8px' }}>{getPrizeLabel(secondCat, secondSub, 'second')}</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Tag color="yellow">三等奖</Tag>
              <span style={{ marginLeft: '8px' }}>{getPrizeLabel(thirdCat, thirdSub, 'third')}</span>
            </div>
            {suggestions && (
              <div style={{ marginBottom: '10px' }}>
                <Tag color="green">对年会建议</Tag>
                <span style={{ marginLeft: '8px' }}>{suggestions}</span>
              </div>
            )}
            <Divider type="dashed-teal" />
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button type="primary" onClick={resetForm}>再填一份</Button>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  const summaryText = `姓名：${name}；一等奖：${getPrizeLabel(firstCat, firstSub, 'first')}；二等奖：${getPrizeLabel(secondCat, secondSub, 'second')}；三等奖：${getPrizeLabel(thirdCat, thirdSub, 'third')}。`;

  return (
    <>
      <NotificationContainer />
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title size="large">{'年会奖品许愿'}</Title>
          <p className="section-intro" style={{ marginTop: '12px' }}>
            年终岁末，为了让心愿照进现实，请花 2 分钟许下你最想要的年会奖品～
          </p>
        </div>

        {/* Progress */}
        <div className="card" style={{ padding: '20px 28px' }}>
          <Progress percent={progress} size="middle" showInfo={false} />
        </div>

        {/* Basic Info */}
        <div className="card">
          <Title size="small" color="app-yellow">{'基本信息'}</Title>
          <Divider type="dashed-teal" />
          <div className="form-item" style={{ marginBottom: 0 }}>
            <label className="form-label">姓名<span className="required">*</span></label>
            <Input value={name} onChange={(e: any) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }}
              placeholder="请输入你的姓名" allowClear
              status={errors.name ? 'error' : undefined} />
            {errors.name && <div className="form-error-msg">{errors.name}</div>}
          </div>
        </div>

        {/* Prize Preferences */}
        <div className="card">
          <Title size="small">{'奖品偏好'}</Title>
          <Divider type="dashed-teal" />

          {/* 一等奖 */}
          {renderPrizeSelect('first', firstCat, setFirstCat, firstSub, setFirstSub, firstOther, setFirstOther, 'first', '一等奖（期望）')}

          <Divider type="dashed" style={{ margin: '16px 0' }} />

          {/* 二等奖 */}
          {renderPrizeSelect('second', secondCat, setSecondCat, secondSub, setSecondSub, secondOther, setSecondOther, 'second', '二等奖（期望）')}

          <Divider type="dashed" style={{ margin: '16px 0' }} />

          {/* 三等奖 */}
          {renderPrizeSelect('third', thirdCat, setThirdCat, thirdSub, setThirdSub, thirdOther, setThirdOther, 'third', '三等奖（期望）')}
        </div>

        {/* Suggestions */}
        <div className="card card-dashed">
          <Title size="small">{'对年会建议'}</Title>
          <Divider type="dashed-teal" />
          <div className="form-item" style={{ marginBottom: 0 }}>
            <label className="form-label">有什么对年会的建议或想法？（选填）</label>
            <div className="textarea-wrap">
              <textarea className="textarea-elem" value={suggestions} rows={4}
                placeholder="比如：希望年会能增加更多互动环节，或者场地布置可以更有氛围～"
                onChange={e => setSuggestions(e.target.value)} />
            </div>
            <p className="form-hint">我们会认真考虑每一条建议（认真脸）</p>
          </div>
        </div>

        {/* Submit */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button type="primary" size="large" block loading={submitting}
            onClick={handleSubmit} disabled={submitting || !prizeLoaded}>
            {!prizeLoaded ? '加载中...' : '提交许愿'}
          </Button>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--animal-text-muted)' }}>
            提交后将无法修改，请确认信息无误
          </p>
        </div>

        {/* Bottom Admin & Stats */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px', marginBottom: '24px' }}>
          <Button size="small" onClick={() => { setAuthMode('admin'); setPwdInput(''); setPwdError(''); }}>
            管理奖品
          </Button>
          <Button size="small" onClick={() => { setAuthMode('stats'); setPwdInput(''); setPwdError(''); }}>
            统计结果
          </Button>
        </div>

        <Footer />
      </div>

      {/* Confirm Modal */}
      <Modal open={showConfirm} title="确认提交"
        onClose={() => setShowConfirm(false)} onOk={doSubmit}
        typewriter={true} typeSpeed={50} okText="确认提交">
        {summaryText}
      </Modal>

      {/* Password Gate Modal */}
      <Modal open={!!authMode} title={authMode === 'admin' ? '管理奖品 - 密码验证' : '统计结果 - 密码验证'}
        onClose={() => { setAuthMode(null); setPwdInput(''); setPwdError(''); }}
        onOk={handleAuth}
        okText="验证">
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--animal-text-body)' }}>
            请输入管理密码：
          </p>
          <input className="input-elem" type="password" value={pwdInput}
            onChange={e => { setPwdInput(e.target.value); setPwdError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAuth(); }}
            placeholder="请输入密码"
            style={{ width: '100%', textAlign: 'center', fontSize: '16px' }} />
          {pwdError && <p style={{ color: '#d4602f', fontSize: '13px', marginTop: '8px' }}>{pwdError}</p>}
        </div>
      </Modal>

      {/* Prize Admin Modal */}
      <Modal open={showAdmin} title="管理奖品"
        onClose={() => setShowAdmin(false)}
        footer={null}>
        <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <PrizeAdmin
            data={prizeData}
            onSave={handleSavePrizes}
            onClose={() => setShowAdmin(false)} />
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal open={showStats} title="统计结果"
        onClose={() => setShowStats(false)}
        footer={null}>
        <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <StatsPanel prizeData={prizeData} />
        </div>
      </Modal>
    </>
  );
}
