'use client';

import React, { useState, useRef } from 'react';
import { Button, Input, Modal, Notification } from './animal-ui';
import * as XLSX from 'xlsx';

interface PrizeData {
  label: string;
  icon: string;
  subs: { value: string; label: string }[];
}

interface PrizeAdminProps {
  data: Record<string, PrizeData>;
  onSave: (data: Record<string, PrizeData>) => void;
  onClose: () => void;
}

export function PrizeAdmin({ data, onSave, onClose }: PrizeAdminProps) {
  const [localData, setLocalData] = useState<Record<string, PrizeData>>(() => JSON.parse(JSON.stringify(data)));
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState({ catKey: null as string | null, subIdx: null as number | null, value: '' });
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; key: string; subIdx?: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const catKeys = Object.keys(localData);

  const updateCat = (key: string, updates: Partial<PrizeData>) => {
    setLocalData(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  };

  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    const key = 'cat_' + Date.now();
    setLocalData(prev => ({ ...prev, [key]: { label: newCatLabel.trim(), icon: 'star', subs: [] } }));
    setNewCatLabel('');
  };

  const addSub = (catKey: string) => {
    if (!newSubLabel.trim()) return;
    const subs = [...localData[catKey].subs, { value: 'sub_' + Date.now(), label: newSubLabel.trim() }];
    updateCat(catKey, { subs });
    setNewSubLabel('');
    setAddingSubTo(null);
  };

  const removeSub = (catKey: string, idx: number) => {
    const subs = localData[catKey].subs.filter((_, i) => i !== idx);
    updateCat(catKey, { subs });
  };

  const removeCat = (key: string) => {
    const copy = { ...localData };
    delete copy[key];
    setLocalData(copy);
    setConfirmDelete(null);
  };

  // 下载导入模板
  const downloadTemplate = () => {
    const templateData = [
      { 大类: '数码电子', 子类: 'iPhone' },
      { 大类: '数码电子', 子类: 'iPad' },
      { 大类: '数码电子', 子类: 'AirPods' },
      { 大类: '家居生活', 子类: '扫地机器人' },
      { 大类: '家居生活', 子类: '咖啡机' },
      { 大类: '食品礼盒', 子类: '零食大礼包' },
      { 大类: '食品礼盒', 子类: '茶叶礼盒' },
      { 大类: '运动健身', 子类: '筋膜枪' },
      { 大类: '旅行基金', 子类: '国内短途游' },
      { 大类: '购物卡券', 子类: '京东卡' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '奖品模板');
    XLSX.writeFile(wb, '奖品导入模板.xlsx');
  };

  // 处理文件导入
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error('读取文件失败');

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
          setImportError('文件内容为空或格式不正确');
          return;
        }

        // 找到"大类"和"子类"列索引
        const headers = jsonData[0] as string[];
        const catIdx = headers.findIndex(h => h.includes('大类') || h.toLowerCase().includes('category'));
        const subIdx = headers.findIndex(h => h.includes('子类') || h.toLowerCase().includes('sub'));

        if (catIdx === -1 || subIdx === -1) {
          setImportError('找不到"大类"和"子类"列，请使用模板格式');
          return;
        }

        // 解析数据
        const newData: Record<string, PrizeData> = {};
        const seenSubs: Record<string, Set<string>> = {};

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const catLabel = String(row[catIdx] || '').trim();
          const subLabel = String(row[subIdx] || '').trim();
          if (!catLabel || !subLabel) continue;

          if (!seenSubs[catLabel]) {
            seenSubs[catLabel] = new Set();
          }
          if (seenSubs[catLabel].has(subLabel)) continue;
          seenSubs[catLabel].add(subLabel);

          // 查找是否已有相同 label 的类别
          let catKey = Object.keys(newData).find(k => newData[k].label === catLabel);
          if (!catKey) {
            catKey = 'cat_' + Date.now() + '_' + Object.keys(newData).length;
            newData[catKey] = { label: catLabel, icon: 'star', subs: [] };
          }

          const subValue = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
          newData[catKey].subs.push({ value: subValue, label: subLabel });
        }

        if (Object.keys(newData).length === 0) {
          setImportError('未能解析到有效数据');
          return;
        }

        setLocalData(newData);
        Notification.success({ message: `导入成功！共 ${Object.keys(newData).length} 个大类` });
      } catch (err: any) {
        setImportError('导入失败: ' + (err.message || '未知错误'));
      }
    };
    reader.readAsBinaryString(file);

    // 重置 input 以便可以重复导入同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 清空所有
  const handleClearAll = () => {
    setLocalData({});
    setShowClearConfirm(false);
    Notification.info({ message: '已清空所有奖品数据，请记得保存' });
  };

  return (
    <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Button size="small" onClick={downloadTemplate}>下载导入模板</Button>
        <Button size="small" onClick={() => fileInputRef.current?.click()}>导入 Excel</Button>
        <Button size="small" danger onClick={() => setShowClearConfirm(true)}>清空全部</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </div>
      {importError && (
        <p style={{ color: '#d4602f', fontSize: '13px', marginBottom: '12px' }}>{importError}</p>
      )}

      {/* 奖品列表 */}
      {catKeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          暂无奖品数据，请添加或使用导入功能
        </div>
      ) : (
        catKeys.map(key => (
          <div key={key} style={{ marginBottom: '16px', padding: '12px', border: '1.5px solid var(--animal-border)', borderRadius: 'var(--animal-radius-lg)', background: 'var(--animal-bg-input)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {editingCat === key ? (
                <>
                  <Input value={localData[key].label} onChange={(e: any) => updateCat(key, { label: e.target.value })} style={{ flex: 1 }} />
                  <Button size="small" onClick={() => setEditingCat(null)}>完成</Button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--animal-text)', flex: 1 }}>{localData[key].label}</span>
                  <Button size="small" onClick={() => setEditingCat(key)}>编辑</Button>
                  <Button size="small" danger onClick={() => setConfirmDelete({ type: 'cat', key })}>删除</Button>
                </>
              )}
            </div>
            <div style={{ paddingLeft: '12px' }}>
              {localData[key].subs.map((sub, idx) => (
                <div key={sub.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {editingSub.catKey === key && editingSub.subIdx === idx ? (
                    <>
                      <Input value={editingSub.value} onChange={(e: any) => setEditingSub({ ...editingSub, value: e.target.value })} style={{ flex: 1 }} />
                      <Button size="small" onClick={() => {
                        const subs = localData[key].subs.map((s, i) => i === idx ? { ...s, label: editingSub.value } : s);
                        updateCat(key, { subs });
                        setEditingSub({ catKey: null, subIdx: null, value: '' });
                      }}>完成</Button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '14px', color: 'var(--animal-text-body)', flex: 1 }}>{sub.label}</span>
                      <Button size="small" onClick={() => setEditingSub({ catKey: key, subIdx: idx, value: sub.label })}>编辑</Button>
                      <Button size="small" danger onClick={() => removeSub(key, idx)}>删除</Button>
                    </>
                  )}
                </div>
              ))}
              {addingSubTo === key ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Input value={newSubLabel} onChange={(e: any) => setNewSubLabel(e.target.value)} placeholder="子类名称" style={{ flex: 1 }} />
                  <Button size="small" onClick={() => addSub(key)}>添加</Button>
                  <Button size="small" onClick={() => { setAddingSubTo(null); setNewSubLabel(''); }}>取消</Button>
                </div>
              ) : (
                <Button size="small" onClick={() => setAddingSubTo(key)} style={{ marginTop: '6px' }}>+ 添加子类</Button>
              )}
            </div>
          </div>
        ))
      )}

      {/* 添加大类 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px', border: '1.5px dashed var(--animal-border)', borderRadius: 'var(--animal-radius-lg)' }}>
        <Input value={newCatLabel} onChange={(e: any) => setNewCatLabel(e.target.value)} placeholder="新大类名称" style={{ flex: 1 }} />
        <Button size="small" onClick={addCategory}>+ 添加大类</Button>
      </div>

      {/* 底部按钮 */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
        <Button type="primary" onClick={() => { onSave(localData); }}>保存更改</Button>
        <Button onClick={onClose}>取消</Button>
      </div>

      {/* 删除确认 Modal */}
      {confirmDelete && (
        <Modal open={true} title="确认删除"
          onClose={() => setConfirmDelete(null)}
          onOk={() => {
            if (confirmDelete.type === 'cat') removeCat(confirmDelete.key);
            setConfirmDelete(null);
          }}>
          {confirmDelete.type === 'cat'
            ? `确定要删除大类「${localData[confirmDelete.key]?.label}」吗？该大类下的所有子类也会被删除，且已填写的问卷中引用该类别的数据将失效。`
            : '确定要删除这个子类吗？'}
        </Modal>
      )}

      {/* 清空确认 Modal */}
      {showClearConfirm && (
        <Modal open={true} title="确认清空全部"
          onClose={() => setShowClearConfirm(false)}
          onOk={handleClearAll}>
          确定要清空所有奖品数据吗？此操作不可撤销，已填写的问卷将失去奖品关联。
        </Modal>
      )}
    </div>
  );
}
